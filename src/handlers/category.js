import db from '../../database/db.js';

function getAllTopics() {
    return new Promise((resolve, reject) => {
        db.all("SELECT * FROM topics ORDER BY title ASC", [], (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

export async function listCategories(req, res, next) {
    try {
        const topics = await getAllTopics();
        res.json(topics);
    } catch (err) { next(err); }
}
