<<<<<<< HEAD
-- HOTWELL schema for SQLite

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  telegram_id INTEGER UNIQUE NOT NULL,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  points INTEGER DEFAULT 0,
  free_chances INTEGER DEFAULT 3,
  last_daily TEXT
=======
CREATE TABLE IF NOT EXISTS users (
  user_id TEXT PRIMARY KEY,
  username TEXT,
  first_name TEXT,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
>>>>>>> 0f95f85 (Add HOT WELL Telegram backend)
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
<<<<<<< HEAD
  update_id INTEGER UNIQUE NOT NULL,
  user_telegram_id INTEGER NOT NULL,
  chat_id INTEGER NOT NULL,
  emoji TEXT NOT NULL,
  value INTEGER NOT NULL,
  points_awarded INTEGER NOT NULL,
  timestamp INTEGER NOT NULL,
  username TEXT,
  first_name TEXT
);

CREATE INDEX IF NOT EXISTS idx_results_timestamp ON results(timestamp DESC);
=======
  update_id INTEGER UNIQUE,
  user_id TEXT NOT NULL,
  chat_id TEXT,
  emoji TEXT NOT NULL,
  value INTEGER NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_results_user_id ON results(user_id);
CREATE INDEX IF NOT EXISTS idx_results_created_at ON results(created_at);
>>>>>>> 0f95f85 (Add HOT WELL Telegram backend)
