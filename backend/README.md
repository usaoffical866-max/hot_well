# HOTWELL backend (Telegram webhook + API)

Overview
- Node.js + Express backend to process Telegram dice updates and maintain virtual points.
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
   - backend/package.json
   - backend/server.js
   - backend/schema.sql (optional reference)
   - backend/README.md

2. Install dependencies:
   cd backend
   npm install

3. Run server:
   BOT_TOKEN="your_bot_token_here" WEBHOOK_SECRET="a_strong_secret" npm start

Database (changed)
- This backend no longer uses SQLite or any native compiled binaries.
- It uses a simple JSON file for storage by default at backend/hotwell.json (or path set by DB_PATH env var).
- The JSON file structure contains users and results arrays and is safe for single-process use such as on Render.
- For production or multi-instance deployments use an external managed database (Postgres, Redis, etc.).

Render Deployment Notes
- Render environments do not support building native Node bindings by default (GLIBC issues). This project avoids native binaries by using a JSON file store.
- Ensure your service has writable disk (Render's ephemeral disk works for single-instance apps; for durability use an external DB).
- Set the following environment variables on Render:
  - BOT_TOKEN: your Telegram bot token
  - WEBHOOK_SECRET: secret used for Telegram setWebhook secret_token
  - PORT: optional
  - DB_PATH: optional path to JSON DB file (e.g., /tmp/hotwell.json or ./backend/hotwell.json)
- Do NOT put secrets in the repository.

Testing
- Send animated dice in the configured Telegram group: 🎲 🎯 🏀 ⚽ 🎳 🎰
- Verify POST /telegram/webhook receives update (use a public URL or Render domain).
- Check GET /api/results and GET /api/leaderboard to confirm stored data.
- For Mini App calls, GET /api/me expects initData URL-encoded and validates it server-side.
