import { getCommentsByPost, getCommentById, createComment, updateComment, deleteComment } from '../repository/comment.js';
import { validateComment } from '../utils/validate.js';

export async function listComments(req, res, next) {
    try {
        const comments = await getCommentsByPost(req.params.postId);
        res.json(comments);
    } catch (err) { next(err); }
}

export async function addComment(req, res, next) {
    try {
        const errors = validateComment(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const comment = await createComment({
            post_id: req.params.postId,
            user_id: req.user.id,
            body: req.body.body,
        });
        res.status(201).json(comment);
    } catch (err) { next(err); }
}

export async function editComment(req, res, next) {
    try {
        const comment = await getCommentById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Forbidden' });

        const errors = validateComment(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const result = await updateComment(req.params.id, req.body.body);
        res.json(result);
    } catch (err) { next(err); }
}

export async function removeComment(req, res, next) {
    try {
        const comment = await getCommentById(req.params.id);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });
        if (comment.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Forbidden' });

        await deleteComment(req.params.id);
        res.status(204).end();
    } catch (err) { next(err); }
}
