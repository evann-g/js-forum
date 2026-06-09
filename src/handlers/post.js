import * as postService from '../services/post.js';
import { validatePost } from '../utils/validate.js';

export async function listPosts(req, res, next) {
    try {
        const { topic_id, user_id, sort } = req.query;
        const posts = await postService.getAllPosts({ topic_id, user_id, sort });
        res.json(posts);
    } catch (err) { next(err); }
}

export async function getPost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (err) { next(err); }
}

export async function createPost(req, res, next) {
    try {
        const errors = validatePost(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const { title, body, topic_id, image_url } = req.body;
        const post = await postService.createPost({ title, body, topic_id, user_id: req.user.id, image_url });
        res.status(201).json(post);
    } catch (err) { next(err); }
}

export async function updatePost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Forbidden' });

        const errors = validatePost(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const result = await postService.updatePost(req.params.id, req.body);
        res.json(result);
    } catch (err) { next(err); }
}

export async function deletePost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        if (post.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Forbidden' });

        await postService.deletePost(req.params.id);
        res.status(204).end();
    } catch (err) { next(err); }
}
