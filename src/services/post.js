import * as postRepo from '../repository/post.js';

export const getAllPosts = (filters) => postRepo.getAllPosts(filters);
export const getPostById = (id) => postRepo.getPostById(id);
export const createPost = (data) => postRepo.createPost(data);
export const updatePost = (id, data) => postRepo.updatePost(id, data);
export const deletePost = (id) => postRepo.deletePost(id);