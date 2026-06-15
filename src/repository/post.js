import db from '../../database/db.js';

function attachCategories(posts) {
    if (!posts.length) return Promise.resolve(posts);
    const ids = posts.map(p => p.id);
    const placeholders = ids.map(() => '?').join(',');
    return new Promise((resolve, reject) => {
        db.all(
            `SELECT pc.post_id, t.id, t.title
             FROM post_categories pc
             JOIN topics t ON pc.topic_id = t.id
             WHERE pc.post_id IN (${placeholders})`,
            ids,
            (err, rows) => {
                if (err) return reject(err);
                const map = {};
                for (const row of rows) {
                    if (!map[row.post_id]) map[row.post_id] = [];
                    map[row.post_id].push({ id: row.id, title: row.title });
                }
                resolve(posts.map(p => ({ ...p, categories: map[p.id] || [] })));
            }
        );
    });
}

export function getAllPosts({ topic_id, user_id, sort, liked_by } = {}) {
    let query = `
        SELECT DISTINCT p.*, u.username
        FROM posts p
        JOIN users u ON p.user_id = u.id
        WHERE 1=1
    `;
    const params = [];

    if (topic_id) {
        query += ' AND p.id IN (SELECT post_id FROM post_categories WHERE topic_id = ?)';
        params.push(topic_id);
    }
    if (user_id) {
        query += ' AND p.user_id = ?';
        params.push(user_id);
    }
    if (liked_by) {
        query += ' AND p.id IN (SELECT post_id FROM post_votes WHERE user_id = ? AND vote = 1)';
        params.push(liked_by);
    }
    if (sort === 'likes') query += ' ORDER BY p.likes DESC';
    else query += ' ORDER BY p.created_at DESC';

    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) return reject(err);
            attachCategories(rows).then(resolve).catch(reject);
        });
    });
}

export function getPostById(id) {
    return new Promise((resolve, reject) => {
        db.get(
            `SELECT p.*, u.username FROM posts p
             JOIN users u ON p.user_id = u.id
             WHERE p.id = ?`,
            [id],
            (err, row) => {
                if (err) return reject(err);
                if (!row) return resolve(null);
                attachCategories([row]).then(posts => resolve(posts[0])).catch(reject);
            }
        );
    });
}

export function createPost(data) {
    const { title, body, user_id, image_url, category_ids = [] } = data;
    return new Promise((resolve, reject) => {
        db.run(
            "INSERT INTO posts (title, body, user_id, image_url) VALUES (?, ?, ?, ?)",
            [title, body, user_id, image_url || null],
            function (err) {
                if (err) return reject(err);
                const postId = this.lastID;
                if (!category_ids.length) return resolve({ id: postId });
                const placeholders = category_ids.map(() => '(?, ?)').join(',');
                const params = category_ids.flatMap(cid => [postId, cid]);
                db.run(
                    `INSERT OR IGNORE INTO post_categories (post_id, topic_id) VALUES ${placeholders}`,
                    params,
                    (err) => { if (err) reject(err); else resolve({ id: postId }); }
                );
            }
        );
    });
}

export function updatePost(id, data) {
    const { title, body, image_url, category_ids } = data;
    return new Promise((resolve, reject) => {
        db.run(
            "UPDATE posts SET title = ?, body = ?, image_url = ? WHERE id = ?",
            [title, body, image_url || null, id],
            function (err) {
                if (err) return reject(err);
                if (!category_ids) return resolve({ changes: this.changes });
                // Replace categories
                db.run("DELETE FROM post_categories WHERE post_id = ?", [id], (err) => {
                    if (err) return reject(err);
                    if (!category_ids.length) return resolve({ changes: 1 });
                    const placeholders = category_ids.map(() => '(?, ?)').join(',');
                    const params = category_ids.flatMap(cid => [id, cid]);
                    db.run(
                        `INSERT OR IGNORE INTO post_categories (post_id, topic_id) VALUES ${placeholders}`,
                        params,
                        (err) => { if (err) reject(err); else resolve({ changes: 1 }); }
                    );
                });
            }
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