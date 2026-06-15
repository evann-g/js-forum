import { Router } from 'express';
import { login, register, logoutHandler, me } from '../handlers/auth.js';
import { listPosts, getPost, createPost, updatePost, deletePost, uploadMiddleware } from '../handlers/post.js';
import { listComments, addComment, editComment, removeComment } from '../handlers/comment.js';
import { likePost, dislikePost, likeComment, dislikeComment } from '../handlers/like.js';
import { listCategories } from '../handlers/category.js';
import { requireAuth } from '../middleware/auth.js';
import { authLimiter, apiLimiter } from '../middleware/rateLimit.js';

const router = Router();

// Health
router.get('/', (req, res) => res.json({ message: 'API is running' }));

// Auth
router.post('/auth/login', authLimiter, login);
router.post('/auth/inscription', authLimiter, register);
router.post('/auth/register', authLimiter, register);  // alias
router.post('/auth/logout', logoutHandler);
router.get('/auth/me', me);  // public — returns null if not logged in (needs attachUser in server)

// Categories / topics
router.get('/categories', listCategories);
router.get('/topics', listCategories);  // alias

// Posts
router.get('/posts', apiLimiter, listPosts);
router.get('/posts/:id', apiLimiter, getPost);
router.post('/posts', requireAuth, uploadMiddleware, createPost);
router.put('/posts/:id', requireAuth, uploadMiddleware, updatePost);
router.delete('/posts/:id', requireAuth, deletePost);

// Comments
router.get('/posts/:postId/comments', listComments);
router.post('/posts/:postId/comments', requireAuth, addComment);
router.put('/comments/:id', requireAuth, editComment);
router.delete('/comments/:id', requireAuth, removeComment);

// Votes
router.post('/posts/:id/like', requireAuth, likePost);
router.post('/posts/:id/dislike', requireAuth, dislikePost);
router.post('/comments/:id/like', requireAuth, likeComment);
router.post('/comments/:id/dislike', requireAuth, dislikeComment);

export default router;
