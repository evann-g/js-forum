import db from '../../database/db.js';

export function getCommentsByPost(postId) {
    return new Promise((resolve, reject) => {
        db.all(
            'select c.*, u.username FROM comments c JOIN users u ON c.user_id = u.id WHERE c.post_id = ? ORDER BY c.created_at DESC',
            [postId],
            (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(rows);
                }
            }
        );
    });
}

export function getCommentById(commentId) {
    return new Promise((resolve, reject) => {
        db.get(
            'SELECT * FROM comments WHERE id = ?',
            [commentId],
            (err, row) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(row);
                }
            }
        );
    });
}

export function createComment(data) {
    const { post_id, user_id, body } = data;
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO comments (post_id, user_id, body) VALUES (?, ?, ?)",
            [post_id, user_id, body],
            function (err) {
                if (err) reject(err); else resolve({ id: this.lastID });
            }
        );
    });
}

export function updateComment(id, body) {
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE comments SET body = ?, updated_at = datetime('now') WHERE id = ?",
            [body, id],
            function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
        );
    });
}

export function deleteComment(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM comments WHERE id = ?", [id],
            function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
        );
    });
}