import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database/BaseDeDonné.db');

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY,
  username VARCHAR,
  email VARCHAR,
  password VARCHAR,
  role VARCHAR,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS topics (
  id INTEGER PRIMARY KEY,
  title VARCHAR,
  description TEXT,
  created_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY,
  topic_id INTEGER NOT NULL,
  title VARCHAR,
  body TEXT,
  user_id INTEGER NOT NULL,
  status VARCHAR,
  likes INTEGER,
  dislikes INTEGER,
  created_at TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS follows (
  following_user_id INTEGER,
  followed_user_id INTEGER,
  created_at TIMESTAMP,
  FOREIGN KEY (following_user_id) REFERENCES users(id),
  FOREIGN KEY (followed_user_id) REFERENCES users(id)
);
`;

db.exec(schema);

db.run("INSERT OR IGNORE INTO users (id, username, password, role) VALUES (0, 'alice', 'admin', 'admin')");
db.run("INSERT OR IGNORE INTO users (id, username, role) VALUES (1, 'Bob', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, role) VALUES (2, 'Candice', 'moderator')");
db.run("INSERT OR IGNORE INTO users (id, username, role) VALUES (3, 'David', 'member')");

db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (1, 0, '2026-01-01')");
db.run("INSERT OR IGNORE INTO follows (following_user_id, followed_user_id, created_at) VALUES (3, 2, '2026-02-28')");

db.run("INSERT OR IGNORE INTO posts (id, title, user_id) VALUES (0, 'Welcome to the forum!', 0)");
db.run("INSERT OR IGNORE INTO posts (id, title, user_id) VALUES (1, 'Guidelines', 1)");
db.run("INSERT OR IGNORE INTO posts (id, title, user_id) VALUES (2, 'Hello all!', 3)");


export default db;
