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
  email VARCHAR UNIQUE,
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
  title VARCHAR,
  body TEXT,
  user_id INTEGER NOT NULL,
  status VARCHAR DEFAULT 'open',
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  post_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  body TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT (datetime('now')),
  updated_at TIMESTAMP,
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS post_votes (
  user_id INTEGER NOT NULL,
  post_id INTEGER NOT NULL,
  vote INTEGER NOT NULL,
  PRIMARY KEY (user_id, post_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS comment_votes (
  user_id INTEGER NOT NULL,
  comment_id INTEGER NOT NULL,
  vote INTEGER NOT NULL,
  PRIMARY KEY (user_id, comment_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (comment_id) REFERENCES comments(id) ON DELETE CASCADE
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
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS post_categories (
  post_id INTEGER NOT NULL,
  topic_id INTEGER NOT NULL,
  PRIMARY KEY (post_id, topic_id),
  FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
  FOREIGN KEY (topic_id) REFERENCES topics(id) ON DELETE CASCADE
);
`;

db.exec(schema);

// Seed data — passwords are bcrypt hashes of 'admin' (cost 12).
// NOTE: In production, remove these seeds and register users properly via the API.
db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (1, 'alice', '$2b$12$0xQz7bW1E3XYYkX9Rtr4/u2CZwWcUfJH5mvawK6Q8FdhZPtTrJcp6', 'admin')");
// Bob, Candice, David have placeholder hashes — replace them by calling POST /api/auth/inscription
db.run("INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (2, 'Bob', 'bob@example.com', '$2b$12$placeholder_replace_with_real_hash', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (3, 'Candice', 'candice@example.com', '$2b$12$placeholder_replace_with_real_hash', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, email, password, role) VALUES (4, 'David', 'david@example.com', '$2b$12$placeholder_replace_with_real_hash', 'member')");

db.run("INSERT OR IGNORE INTO topics (id, title) VALUES (1, 'General')");

db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (1, 1, 'Welcome to the forum!', 1)");
db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (2, 1, 'Guidelines', 2)");
db.run("INSERT OR IGNORE INTO posts (id, topic_id, title, user_id) VALUES (3, 1, 'Hello all!', 4)");

db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (2, 1, '2026-01-01')");
db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (4, 3, '2026-02-28')");

// Seed sessions are intentionally expired (2026-01-01) so they won't authenticate anyone.
db.run("INSERT OR IGNORE INTO sessions (user_id, token, expires_at) VALUES (1, 'session_token_1', '2026-01-01 00:00:00')");
db.run("INSERT OR IGNORE INTO sessions (user_id, token, expires_at) VALUES (2, 'session_token_2', '2026-01-01 00:00:00')");

export const closeDb = () => new Promise((resolve, reject) => {
    db.close((err) => {
        if (err) reject(err);
        else resolve();
    });
});

export default db;
