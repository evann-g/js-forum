import db from '../../database/db.js';

export function getAllPosts({ topic_id, user_id, sort } = {}) {
    let query = `
        SELECT p.*, u.username, t.title as topic_title
        FROM posts p
        JOIN users u ON p.user_id = u.id
        JOIN topics t ON p.topic_id = t.id
        WHERE 1=1
    `;
    const params = [];
    if (topic_id) { query += ' AND p.topic_id = ?'; params.push(topic_id); }
    if (user_id) { query += ' AND p.user_id = ?'; params.push(user_id); }
    if (sort === 'likes') query += ' ORDER BY p.likes DESC';
    else query += ' ORDER BY p.created_at DESC';

    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => { if (err) reject(err); else resolve(rows); });
    });
}

export function getPostById(id) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT p.*, u.username, t.title as topic_title
             FROM posts p JOIN users u ON p.user_id = u.id JOIN topics t ON p.topic_id = t.id
             WHERE p.id = ?`,
            [id],
            (err, row) => { if (err) reject(err); else resolve(row || null); }
        );
    });
}

export function createPost(data) {
    const { topic_id, title, body, user_id, image_url } = data;
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO posts (topic_id, title, body, user_id, image_url) VALUES (?, ?, ?, ?, ?)",
            [topic_id, title, body, user_id, image_url || null],
            function (err) { if (err) reject(err); else resolve({ id: this.lastID }); }
        );
    });
}

export function updatePost(id, data) {
    const { title, body, image_url } = data;
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE posts SET title = ?, body = ?, image_url = ? WHERE id = ?",
            [title, body, image_url || null, id],
            function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
        );
    });
}

export function deletePost(id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM posts WHERE id = ?", [id],
            function (err) { if (err) reject(err); else resolve({ changes: this.changes }); }
        );
    });
}
