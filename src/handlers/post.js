import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import * as postService from '../services/post.js';
import { validatePost } from '../utils/validate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ─── Multer setup ──────────────────────────────────────────────────────────────
const UPLOAD_DIR = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOAD_DIR),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, Date.now() + '-' + Math.round(Math.random() * 1e9) + ext);
    }
});

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const upload = multer({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
    fileFilter: (req, file, cb) => {
        if (ALLOWED_TYPES.includes(file.mimetype)) cb(null, true);
        else cb(new Error('Format non supporté (JPEG, PNG, GIF, WEBP uniquement).'));
    }
});

// Export so the router can apply it before the handler
export const uploadMiddleware = upload.single('image');

// ─── Handlers ──────────────────────────────────────────────────────────────────

export async function listPosts(req, res, next) {
    try {
        const { topic_id, user_id, sort, liked_by } = req.query;
        const posts = await postService.getAllPosts({ topic_id, user_id, sort, liked_by });
        res.json(posts);
    } catch (err) { next(err); }
}

export async function getPost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post introuvable.' });
        res.json(post);
    } catch (err) { next(err); }
}

export async function createPost(req, res, next) {
    try {
        const errors = validatePost(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const { title, body, image_url: bodyImageUrl, category_ids } = req.body;

        // Prefer an uploaded file; fall back to a URL provided in the body
        const image_url = req.file
            ? '/uploads/' + req.file.filename
            : (bodyImageUrl || null);

        const catIds = Array.isArray(category_ids)
            ? category_ids.map(Number)
            : category_ids ? [Number(category_ids)] : [];

        const post = await postService.createPost({
            title, body, user_id: req.user.id, image_url, category_ids: catIds
        });
        res.status(201).json(post);
    } catch (err) { next(err); }
}

export async function updatePost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post introuvable.' });

        // Only the author OR admin/moderator can edit
        if (post.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Accès refusé.' });

        const errors = validatePost(req.body);
        if (errors.length) return res.status(400).json({ errors });

        const { title, body, image_url: bodyImageUrl, category_ids } = req.body;

        // Prefer uploaded file, then body URL, then keep the existing one
        const image_url = req.file
            ? '/uploads/' + req.file.filename
            : (bodyImageUrl !== undefined ? (bodyImageUrl || null) : (post.image_url || null));

        const catIds = category_ids !== undefined
            ? (Array.isArray(category_ids) ? category_ids.map(Number) : [Number(category_ids)])
            : undefined;

        const result = await postService.updatePost(req.params.id, { title, body, image_url, category_ids: catIds });
        res.json(result);
    } catch (err) { next(err); }
}

export async function deletePost(req, res, next) {
    try {
        const post = await postService.getPostById(req.params.id);
        if (!post) return res.status(404).json({ error: 'Post introuvable.' });

        // Only the author OR admin/moderator can delete
        if (post.user_id !== req.user.id && req.user.role === 'member')
            return res.status(403).json({ error: 'Accès refusé.' });

        // Clean up uploaded image file if one exists
        if (post.image_url && post.image_url.startsWith('/uploads/')) {
            const filePath = path.join(__dirname, '../../public', post.image_url);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        }

        await postService.deletePost(req.params.id);
        res.status(204).end();
    } catch (err) { next(err); }
}
