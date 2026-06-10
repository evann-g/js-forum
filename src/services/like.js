import * as likeRepo from "../repository/like.js";

export async function voteOnPost(userId, postId) {
    const current = await likeRepo.getPostVote(userId, postId);
    if (current === vote) {
        return await likeRepo.deletePostVote(userId, postId);
    } else {
        return await likeRepo.createPostVote(userId, postId);
    }
    
    await likeRepo.recalcPostVotes(postId);
}

export async function voteOnComment(userId, commentId) {
    const current = await likeRepo.getCommentVote(userId, commentId);
    if (current === vote) {
        return await likeRepo.deleteCommentVote(userId, commentId);
    } else {
        return await likeRepo.createCommentVote(userId, commentId);
    }
    
    await likeRepo.recalcCommentVotes(commentId);
}