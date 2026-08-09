const fs = require('fs');
const path = require('path');

// Simple JSON file DB for Render-compatible storage (no native modules)
// Structure: { users: [...], results: [...], seq: { userId: N, resultId: M } }

function ensureDirExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function load(dbPath) {
  ensureDirExists(dbPath);
  if (!fs.existsSync(dbPath)) {
    const init = { users: [], results: [], seq: { userId: 0, resultId: 0 } };
    fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
    return init;
  }
  try {
    const raw = fs.readFileSync(dbPath, 'utf8');
    return JSON.parse(raw || '{}');
  } catch (e) {
    // If corrupted, back it up and recreate
    const bak = dbPath + '.bak.' + Date.now();
    try { fs.copyFileSync(dbPath, bak); } catch (e) {}
    const init = { users: [], results: [], seq: { userId: 0, resultId: 0 } };
    fs.writeFileSync(dbPath, JSON.stringify(init, null, 2));
    return init;
  }
}

function save(dbPath, data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

module.exports = function(dbPath) {
  dbPath = dbPath || path.join(__dirname, 'hotwell.json');
  const state = load(dbPath);

  function getUserByTelegramId(tid) {
    return state.users.find(u => Number(u.telegram_id) === Number(tid)) || null;
  }

  function insertUser(telegram_id, username, first_name, last_name, points, free_chances, last_daily) {
    const existing = getUserByTelegramId(telegram_id);
    if (existing) throw new Error('USER_EXISTS');
    state.seq.userId += 1;
    const user = {
      id: state.seq.userId,
      telegram_id: Number(telegram_id),
      username: username || null,
      first_name: first_name || null,
      last_name: last_name || null,
      points: Number(points) || 0,
      free_chances: Number(free_chances) || 3,
      last_daily: last_daily || null
    };
    state.users.push(user);
    save(dbPath, state);
    return user;
  }

  function upsertUser(telegram_id, username, first_name, last_name, points, free_chances, last_daily) {
    const existing = getUserByTelegramId(telegram_id);
    if (existing) {
      existing.username = username || existing.username;
      existing.first_name = first_name || existing.first_name;
      existing.last_name = last_name || existing.last_name;
      // do NOT overwrite points/free_chances unless inserting
      save(dbPath, state);
      return existing;
    }
    return insertUser(telegram_id, username, first_name, last_name, points, free_chances, last_daily);
  }

  function updateUserPoints(points, telegram_id) {
    const u = getUserByTelegramId(telegram_id);
    if (!u) return null;
    u.points = Number(u.points || 0) + Number(points || 0);
    save(dbPath, state);
    return u;
  }

  function insertResult(update_id, user_telegram_id, chat_id, emoji, value, points_awarded, timestamp, username, first_name) {
    // Duplicate check
    if (state.results.some(r => Number(r.update_id) === Number(update_id))) {
      const err = new Error('DUPLICATE_UPDATE_ID');
      err.code = 'DUPLICATE';
      throw err;
    }
    state.seq.resultId += 1;
    const row = {
      id: state.seq.resultId,
      update_id: Number(update_id),
      user_telegram_id: Number(user_telegram_id),
      chat_id: Number(chat_id),
      emoji: emoji,
      value: Number(value),
      points_awarded: Number(points_awarded),
      timestamp: Number(timestamp),
      username: username || null,
      first_name: first_name || null
    };
    state.results.push(row);
    save(dbPath, state);
    return row;
  }

  function recentResults(limit) {
    limit = limit || 50;
    return state.results.slice().sort((a, b) => Number(b.timestamp) - Number(a.timestamp)).slice(0, limit);
  }

  function leaderboardQuery(limit) {
    limit = limit || 50;
    return state.users.slice().sort((a, b) => Number(b.points || 0) - Number(a.points || 0)).slice(0, limit).map(u => ({ telegram_id: u.telegram_id, username: u.username, first_name: u.first_name, points: u.points }));
  }

  return {
    getUserByTelegramId,
    insertUser,
    upsertUser,
    updateUserPoints,
    insertResult,
    recentResults,
    leaderboardQuery,
    dbPath,
    _raw: state
  };
};
