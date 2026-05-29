import bcrypt from "bcrypt";
import db from "../../database/db.js";

/**
 * Register a new user.
 * Password is hashed with bcrypt before storage.
 */
async function addUser(username, email, password) {
  const hashed = await bcrypt.hash(password, 12);
  return new Promise((resolve, reject) => {
    db.run(
      "INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, datetime('now'))",
      [username, email, hashed],
      function (err) {
        if (err) reject(err);
        else resolve({ id: this.lastID });
      }
    );
  });
}

/**
 * Authenticate a user.
 * Returns { success: true, user: { id, username } } or { success: false, message }.
 */
async function authentification(username, password) {
  return new Promise((resolve, reject) => {
    db.get(
      "SELECT id, username, password FROM users WHERE username = ?",
      [username],
      async (err, row) => {
        if (err) return reject(err);
        if (!row) return resolve({ success: false, message: "Invalid credentials" });

        const match = await bcrypt.compare(password, row.password);
        if (!match) return resolve({ success: false, message: "Invalid credentials" });

        resolve({ success: true, user: { id: row.id, username: row.username } });
      }
    );
  });
}

export { authentification , adduser}