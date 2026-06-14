import * as likeRepo from "../repository/like.js";

export async function voteOnPost(userId, postId, vote) {
    const current = await likeRepo.getPostVote(userId, postId);
    if (current === vote) {
        await likeRepo.deletePostVote(userId, postId);
    } else {
        await likeRepo.upsertPostVote(userId, postId, vote);
    }
    await likeRepo.recalcPostVotes(postId);
}

export async function voteOnComment(userId, commentId, vote) {
    const current = await likeRepo.getCommentVote(userId, commentId);
    if (current === vote) {
        await likeRepo.deleteCommentVote(userId, commentId);
    } else {
        await likeRepo.upsertCommentVote(userId, commentId, vote);
    }
    await likeRepo.recalcCommentVotes(commentId);
}
