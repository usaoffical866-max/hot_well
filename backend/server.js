/**
 * HOTWELL backend - Express + SQLite
 *
 * Environment variables:
 *   BOT_TOKEN (required)        - Telegram bot token (never commit to repo)
 *   WEBHOOK_SECRET (required)   - secret used for setWebhook secret_token
 *   PORT (optional)             - server port (default 3000)
 *   DB_PATH (optional)          - DB path (default ./backend/hotwell.db)
 *
 * For local development/testing only:
 *   HOTWELL_DEV=1               - run in dev mode without BOT_TOKEN/WEBHOOK_SECRET validation
 *
 * Endpoints:
 *   POST /telegram/webhook
 *   GET  /api/me?initData=<urlencoded initData>
 *   GET  /api/results
 *   GET  /api/leaderboard
 *
 * Security:
 *   - Validates Telegram WebApp initData server-side using BOT_TOKEN (unless HOTWELL_DEV=1)
 *   - Validates webhook secret via header x-telegram-bot-api-secret-token or x-webhook-secret (unless HOTWELL_DEV=1)
 *   - Prevents duplicate update_id processing via unique constraint
 *   - No secrets in source code
 */

const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');

const BOT_TOKEN = process.env.BOT_TOKEN;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;
const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'hotwell.db');
const SCHEMA_PATH = path.join(__dirname, 'schema.sql');
const DEV_MODE = process.env.HOTWELL_DEV === '1' || process.env.NODE_ENV === 'development';

if (!BOT_TOKEN && !DEV_MODE) {
  console.error('Missing BOT_TOKEN env variable. Abort. (set HOTWELL_DEV=1 for local dev)');
  process.exit(1);
}
if (!WEBHOOK_SECRET && !DEV_MODE) {
  console.error('Missing WEBHOOK_SECRET env variable. Abort. (set HOTWELL_DEV=1 for local dev)');
  process.exit(1);
}

if (DEV_MODE) {
  console.warn('HOTWELL running in DEV MODE: initData and webhook secret validation are relaxed. Do NOT use in production.');
}

// Ensure DB dir exists
const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) fs.mkdirSync(dbDir, { recursive: true });

// Initialize DB and schema
const db = new Database(DB_PATH);
if (!fs.existsSync(SCHEMA_PATH)) {
  console.error('schema.sql missing in backend/ - create backend/schema.sql with required schema.');
  process.exit(1);
}
const schemaSQL = fs.readFileSync(SCHEMA_PATH, 'utf8');
db.exec(schemaSQL);

// Prepared statements
const getUserByTelegramId = db.prepare('SELECT * FROM users WHERE telegram_id = ?');
const insertUser = db.prepare('INSERT INTO users (telegram_id, username, first_name, last_name, points, free_chances, last_daily) VALUES (?, ?, ?, ?, ?, ?, ?)');
const upsertUser = db.prepare(`
  INSERT INTO users (telegram_id, username, first_name, last_name, points, free_chances, last_daily)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(telegram_id) DO UPDATE SET username=excluded.username, first_name=excluded.first_name, last_name=excluded.last_name
`);
const updateUserPoints = db.prepare('UPDATE users SET points = points + ? WHERE telegram_id = ?');

const insertResult = db.prepare(`
  INSERT INTO results (update_id, user_telegram_id, chat_id, emoji, value, points_awarded, timestamp, username, first_name)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const recentResults = db.prepare('SELECT * FROM results ORDER BY timestamp DESC LIMIT 50');
const leaderboardQuery = db.prepare('SELECT telegram_id, username, first_name, points FROM users ORDER BY points DESC LIMIT 50');

// Express app
const app = express();
app.use(bodyParser.json());

// Helper: check webhook secret header
function checkWebhookSecret(req) {
  if (DEV_MODE) return true;
  const h1 = (req.get('x-telegram-bot-api-secret-token') || '').toString();
  const h2 = (req.get('x-webhook-secret') || '').toString();
  if (h1 && h1 === WEBHOOK_SECRET) return true;
  if (h2 && h2 === WEBHOOK_SECRET) return true;
  return false;
}

// Helper: verify Telegram WebApp initData per Telegram docs
function verifyInitData(initData) {
  if (DEV_MODE) return true;
  if (!initData || typeof initData !== 'string') return false;
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) return false;

  const entries = [];
  for (const key of Array.from(params.keys()).sort()) {
    if (key === 'hash') continue;
    const value = params.get(key) || '';
    entries.push(`${key}=${value}`);
  }
  const data_check_string = entries.join('\n');

  // secret_key = sha256(BOT_TOKEN)
  const secretKey = crypto.createHash('sha256').update(BOT_TOKEN).digest();
  const hmac = crypto.createHmac('sha256', secretKey).update(data_check_string).digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(hmac, 'hex'), Buffer.from(hash, 'hex'));
  } catch (e) {
    return false;
  }
}

// Helper parse initData user info
function parseInitDataUser(initData) {
  const params = new URLSearchParams(initData);
  const userRaw = params.get('user');
  if (userRaw) {
    try { return JSON.parse(userRaw); } catch (e) {}
  }
  const user = {};
  if (params.get('user.id')) user.id = Number(params.get('user.id'));
  if (params.get('user.first_name')) user.first_name = params.get('user.first_name');
  if (params.get('user.username')) user.username = params.get('user.username');
  if (params.get('id')) user.id = Number(params.get('id'));
  if (params.get('first_name')) user.first_name = params.get('first_name');
  if (params.get('username')) user.username = params.get('username');
  return user;
}

// Points rules (per spec)
function awardPointsFor(emoji, value) {
  value = Number(value) || 0;
  if (emoji === '🎲') return value === 6 ? 10 : 1;
  if (emoji === '🎯') return value === 6 ? 15 : 1;
  if (emoji === '🏀') return value === 5 ? 10 : 1;
  if (emoji === '⚽') return value === 3 ? 10 : 1;
  if (emoji === '🎳') return value === 6 ? 20 : 1;
  if (emoji === '🎰') return value === 64 ? 50 : 1;
  return 1;
}

/**
 * GET /api/me?initData=<urlencoded initData>
 * - Validates initData server-side
 * - Upserts user and returns user + recent + leaderboard
 */
app.get('/api/me', (req, res) => {
  const initDataRaw = req.query.initData;
  if (!initDataRaw) return res.status(400).json({ ok: false, error: 'initData required' });
  const initData = decodeURIComponent(initDataRaw);
  try {
    if (!verifyInitData(initData)) {
      return res.status(403).json({ ok: false, error: 'invalid initData' });
    }
  } catch (e) {
    return res.status(400).json({ ok: false, error: 'invalid initData format' });
  }

  const user = parseInitDataUser(initData);
  if (!user || !user.id) return res.status(400).json({ ok: false, error: 'user id missing' });

  // Upsert user
  upsertUser.run(user.id, user.username || null, user.first_name || null, user.last_name || null, 0, 3, null);

  const dbUser = getUserByTelegramId.get(user.id);
  const results = recentResults.all().map(r => ({
    id: r.id, emoji: r.emoji, value: r.value, points_awarded: r.points_awarded, timestamp: r.timestamp, username: r.username, first_name: r.first_name
  }));
  const leaderboard = leaderboardQuery.all();

  return res.json({ ok: true, user: dbUser, recent: results, leaderboard });
});

/**
 * GET /api/results
 * Returns recent results
 */
app.get('/api/results', (req, res) => {
  const rows = recentResults.all();
  return res.json({ ok: true, results: rows });
});

/**
 * GET /api/leaderboard
 */
app.get('/api/leaderboard', (req, res) => {
  const rows = leaderboardQuery.all();
  return res.json({ ok: true, leaderboard: rows });
});

/**
 * POST /telegram/webhook
 * - Validates webhook secret header
 * - Processes message.dice updates
 * - Ignores messages from bots
 * - Prevents duplicates using update_id unique constraint
 */
app.post('/telegram/webhook', (req, res) => {
  if (!checkWebhookSecret(req)) {
    console.warn('Invalid or missing webhook secret header');
    return res.status(403).send('forbidden');
  }

  const update = req.body;
  if (!update || typeof update !== 'object') return res.status(400).send('bad request');

  const update_id = update.update_id;
  if (typeof update_id === 'undefined' || update_id === null) return res.status(200).send('ignored');

  const message = update.message || update.edited_message;
  if (!message) return res.status(200).send('no message');

  // Ignore bots
  if (message.from && message.from.is_bot) return res.status(200).send('ignored bot');

  // Only proceed if message.dice exists
  const dice = message.dice;
  if (!dice) return res.status(200).send('no dice');

  const emoji = dice.emoji || '🎲';
  const value = (typeof dice.value === 'number') ? dice.value : Number(dice.value || 0);

  // Validate value
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    console.warn('Invalid dice value', value);
    return res.status(400).send('invalid dice value');
  }

  // Award points per rules
  const points = awardPointsFor(emoji, value);

  // Insert result and update user within transaction
  const tx = db.transaction(() => {
    try {
      insertResult.run(update_id, message.from.id, message.chat.id, emoji, value, points, Math.floor(Date.now() / 1000), message.from.username || null, message.from.first_name || null);
    } catch (err) {
      // If duplicate update_id => ignore
      if (err && err.code === 'SQLITE_CONSTRAINT') {
        // duplicate or other constraint: ignore duplicate update_id
        console.warn('Duplicate update_id or constraint error, ignoring:', update_id);
        return;
      }
      throw err;
    }

    // Ensure user exists
    const u = getUserByTelegramId.get(message.from.id);
    if (!u) {
      insertUser.run(message.from.id, message.from.username || null, message.from.first_name || null, message.from.last_name || null, 0, 3, null);
    }
    // Update points
    updateUserPoints.run(points, message.from.id);
  });

  try {
    tx();
  } catch (e) {
    console.error('Error processing webhook transaction', e);
    return res.status(500).send('error');
  }

  console.log('Processed dice:', message.from.id, emoji, value, 'points', points);
  return res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`HOTWELL backend listening on port ${PORT}`);
});
