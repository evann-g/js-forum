import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new sqlite3.Database(path.join(__dirname, 'forum.db'));

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username VARCHAR NOT NULL UNIQUE,
  email VARCHAR,
  password VARCHAR NOT NULL,
  role VARCHAR DEFAULT 'member',
  created_at TIMESTAMP DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title VARCHAR NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  topic_id INTEGER NOT NULL,
  title VARCHAR,
  body TEXT,
  user_id INTEGER NOT NULL,
  status VARCHAR DEFAULT 'open',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS follows (
  following_user_id INTEGER NOT NULL,
  followed_user_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  PRIMARY KEY (following_user_id, followed_user_id),
  FOREIGN KEY (following_user_id) REFERENCES users(id),
  FOREIGN KEY (followed_user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  token VARCHAR NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  expires_at TIMESTAMP NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

`;

db.exec(schema);

// Seed data — passwords are bcrypt hashes of 'admin' / placeholder
// NOTE: In production, remove these seeds and register users properly.
db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'alice', '$2b$12$0xQz7bW1E3XYYkX9Rtr4/u2CZwWcUfJH5mvawK6Q8FdhZPtTrJcp6', 'admin')");
db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (2, 'Bob', '$2b$12$placeholder_replace_with_real_hash', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (3, 'Candice', '$2b$12$placeholder_replace_with_real_hash', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (4, 'David', '$2b$12$placeholder_replace_with_real_hash', 'member')");

db.run("INSERT OR IGNORE INTO topics (id, title) VALUES (1, 'General')");

db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (1, 1, 'Welcome to the forum!', 1)");
db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (2, 1, 'Guidelines', 2)");
db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (3, 1, 'Hello all!', 4)");

db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (2, 1, '2026-01-01')");
db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (4, 3, '2026-02-28')");

db.run("INSERT OR IGNORE INTO sessions (user_id, token, expires_at) VALUES (1, 'session_token_1', '2026-01-01 00:00:00')");
db.run("INSERT OR IGNORE INTO sessions (user_id, token, expires_at) VALUES (2, 'session_token_2', '2026-01-01 00:00:00')");

export const closeDb = () => new Promise((resolve, reject) => {
    db.close((err) => {
        if (err) reject(err);
        else resolve();
    });
});



export default db;
