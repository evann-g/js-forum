import { voteOnPost, voteOnComment } from '../services/like.js';
import { getPostVoteCounts, getCommentVoteCounts } from '../repository/like.js';

export async function likePost(req, res, next) {
    try {
        await voteOnPost(req.user.id, req.params.id, 1);
        const counts = await getPostVoteCounts(req.params.id);
        res.json({ message: 'Vote enregistré', likes: counts.likes, dislikes: counts.dislikes });
    } catch (err) { next(err); }
}

export async function dislikePost(req, res, next) {
    try {
        await voteOnPost(req.user.id, req.params.id, -1);
        const counts = await getPostVoteCounts(req.params.id);
        res.json({ message: 'Vote enregistré', likes: counts.likes, dislikes: counts.dislikes });
    } catch (err) { next(err); }
}

export async function likeComment(req, res, next) {
    try {
        await voteOnComment(req.user.id, req.params.id, 1);
        const counts = await getCommentVoteCounts(req.params.id);
        res.json({ message: 'Vote enregistré', likes: counts.likes, dislikes: counts.dislikes });
    } catch (err) { next(err); }
}

export async function dislikeComment(req, res, next) {
    try {
        await voteOnComment(req.user.id, req.params.id, -1);
        const counts = await getCommentVoteCounts(req.params.id);
        res.json({ message: 'Vote enregistré', likes: counts.likes, dislikes: counts.dislikes });
    } catch (err) { next(err); }
}
