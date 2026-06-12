import db from '../../database/db.js';

export function getPostVote(user_id, post_id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT vote FROM post_votes WHERE user_id = ? AND post_id = ?",
            [user_id, post_id], (err, row) => {
                if (err) reject(err); else resolve(row?.vote ?? 0);
            });
    });
}

export function upsertPostVote(user_id, post_id, vote) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO post_votes (user_id, post_id, vote) VALUES (?, ?, ?)
             ON CONFLICT(user_id, post_id) DO UPDATE SET vote = excluded.vote`,
            [user_id, post_id, vote],
            (err) => {
                if (err) reject(err); else resolve();
            }
        );
    });
}

export function deletePostVote(user_id, post_id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM post_votes WHERE user_id = ? AND post_id = ?",
            [user_id, post_id], (err) => {
                if (err) {
                    reject(err);
                }  else{
                    resolve();
                }
            });
    });
}

export function recalcPostVotes(post_id) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE posts SET
               likes = (SELECT COUNT(*) FROM post_votes WHERE post_id = ? AND vote = 1),
               dislikes = (SELECT COUNT(*) FROM post_votes WHERE post_id = ? AND vote = -1)
             WHERE id = ?`,
            [post_id, post_id, post_id],
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}

// ---- Comments ----
export function getCommentVote(user_id, comment_id) {
    return new Promise((resolve, reject) => {
        db.get("SELECT vote FROM comment_votes WHERE user_id = ? AND comment_id = ?",
            [user_id, comment_id], (err, row) => { if (err) reject(err); else resolve(row?.vote ?? 0); });
    });
}

export function upsertCommentVote(user_id, comment_id, vote) {
    return new Promise((resolve, reject) => {
        db.run(
            `INSERT INTO comment_votes (user_id, comment_id, vote) VALUES (?, ?, ?)
             ON CONFLICT(user_id, comment_id) DO UPDATE SET vote = excluded.vote`,
            [user_id, comment_id, vote],
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}

export function deleteCommentVote(user_id, comment_id) {
    return new Promise((resolve, reject) => {
        db.run("DELETE FROM comment_votes WHERE user_id = ? AND comment_id = ?",
            [user_id, comment_id], (err) => { if (err) reject(err); else resolve(); });
    });
}

export function recalcCommentVotes(comment_id) {
    return new Promise((resolve, reject) => {
        db.run(
            `UPDATE comments SET
               likes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = ? AND vote = 1),
               dislikes = (SELECT COUNT(*) FROM comment_votes WHERE comment_id = ? AND vote = -1)
             WHERE id = ?`,
            [comment_id, comment_id, comment_id],
            (err) => { if (err) reject(err); else resolve(); }
        );
    });
}
