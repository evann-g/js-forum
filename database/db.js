import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database(path.join(__dirname, "../forum.db"));

export function testConnection() {
  db.prepare("SELECT 1").get();
  console.log("Database connection OK");
}

export function initDB() {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT
    )
  `).run();
  console.log("Table 'users' ready");
}

export function createUser(username, passwordHash) {
  const stmt = db.prepare("INSERT INTO users (username, password) VALUES (?, ?)");
  stmt.run(username, passwordHash);
  console.log("User created");
}

export function getAllUsers() {
  return db.prepare("SELECT * FROM users").all();
}

export default db;
