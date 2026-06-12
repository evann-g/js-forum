import db from '../../database/db.js';

export function findByUsername(username) {
    return new Promise((resolve, reject) => {
        db.get("SELECT * FROM users WHERE username = ?", [username],
            (err, row) => { if (err) reject(err); else resolve(row || null); }
        );
    });
}

export function findById(id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT id, username, email, role, created_at FROM users WHERE id = ?", [id],
            (err, row) => { if (err) reject(err); else resolve(row || null); }
        );
    });
}

export function createUser(username, email, hashedPassword) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
            [username, email, hashedPassword],
            function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
        );
    });
}
