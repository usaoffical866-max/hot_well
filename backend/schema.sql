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
);

CREATE TABLE IF NOT EXISTS results (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
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
