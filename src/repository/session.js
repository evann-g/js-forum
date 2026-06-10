import db from '../../database/db.js';

export function createSession(id, userId, expiresAt) {
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
            [id, userId, expiresAt.toISOString()],
            function (err) { if (err) reject(err); else resolve(); }
        );
    });
}

export function getSession(id) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT s.*, u.id as user_id, u.username, u.role
             FROM sessions s JOIN users u ON s.user_id = u.id
             WHERE s.id = ? AND s.expires_at > datetime('now')`,
            [id],
            (err, row) => { if (err) reject(err); else resolve(row || null); }
        );
    });
}

export function deleteSession(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM sessions WHERE id = ?", [id],
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}

export function deleteExpiredSessions() {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM sessions WHERE expires_at <= datetime('now')",
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}
