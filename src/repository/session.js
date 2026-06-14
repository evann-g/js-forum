import db from '../../database/db.js';

export function createSession(userId, token, expiresAt) {
    return new Promise((resolve, reject) => {
        // Delete any existing session for this user (one session at a time)
        db.run("DELETE FROM sessions WHERE user_id = ?", [userId], (err) => {
            if (err) return reject(err);
            db.run(
                "INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
                [userId, token, new Date(expiresAt).toISOString()],
                function (err) { if (err) reject(err); else resolve(); }
            );
        });
    });
}

export function getSession(token) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT s.*, u.id as user_id, u.username, u.role
             FROM sessions s JOIN users u ON s.user_id = u.id
             WHERE s.token = ? AND s.expires_at > datetime('now')`,
            [token],
            (err, row) => { if (err) reject(err); else resolve(row || null); }
        );
    });
}

export function deleteSession(token) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM sessions WHERE token = ?", [token],
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
