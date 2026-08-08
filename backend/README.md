HOTWELL backend (Telegram webhook + API)

Overview
- Node.js + Express + SQLite backend to process Telegram dice updates and maintain virtual points.
- Endpoints:
  - POST /telegram/webhook
  - GET /api/me?initData=<urlencoded initData>
  - GET /api/results
  - GET /api/leaderboard

Requirements & Security
- BOT_TOKEN and WEBHOOK_SECRET must be provided as environment variables (do not commit them).
- The server validates Telegram WebApp initData using BOT_TOKEN (server-side).
- When calling setWebhook include secret_token so Telegram sends x-telegram-bot-api-secret-token in requests; the server validates that header.
- The webhook ignores messages from other bots and avoids duplicate processing using update_id unique constraint.
- All rewards are virtual points only — no real money, no deposits, no paid chances, no cash-out.

Setup
1. Ensure files exist:
   - backend/package.json (already created)
   - backend/server.js (already created)
   - backend/schema.sql
   - backend/README.md

2. Install dependencies:
   cd backend
   npm install

3. Run server:
   BOT_TOKEN="your_bot_token_here" WEBHOOK_SECRET="a_strong_secret" npm start

Database
- The server will create a SQLite DB file at backend/hotwell.db (or DB_PATH if provided).
- schema.sql defines users and results tables.

Set Telegram webhook
- Example:
  curl -s -X POST "https://api.telegram.org/bot${BOT_TOKEN}/setWebhook" \
    -F url="https://your-domain.example/telegram/webhook" \
    -F secret_token="${WEBHOOK_SECRET}"

Testing
- Send animated dice in the configured Telegram group: 🎲 🎯 🏀 ⚽ 🎳 🎰
- Verify POST /telegram/webhook receives update (use ngrok or similar for local testing).
- Check GET /api/results and GET /api/leaderboard to confirm stored data.
- For Mini App calls, GET /api/me expects initData URL-encoded and validates it server-side.

Notes
- The backend uses update_id as unique to prevent awarding points twice for the same update.
- The server validates numeric dice values and enforces reasonable ranges.
- BOT_TOKEN must never appear in frontend JS or repository files.
