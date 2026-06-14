import { voteOnPost, voteOnComment } from '../services/like.js';

export async function likePost(req, res, next) {
    try {
        await voteOnPost(req.user.id, req.params.id, 1);
        res.json({ message: 'Vote enregistré' });
    } catch (err) { next(err); }
}

export async function dislikePost(req, res, next) {
    try {
        await voteOnPost(req.user.id, req.params.id, -1);
        res.json({ message: 'Vote enregistré' });
    } catch (err) { next(err); }
}

export async function likeComment(req, res, next) {
    try {
        await voteOnComment(req.user.id, req.params.id, 1);
        res.json({ message: 'Vote enregistré' });
    } catch (err) { next(err); }
}

export async function dislikeComment(req, res, next) {
    try {
        await voteOnComment(req.user.id, req.params.id, -1);
        res.json({ message: 'Vote enregistré' });
    } catch (err) { next(err); }
}
