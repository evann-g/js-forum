import db from '../../database/db.js';
import { getSession } from '../repository/session.js';
import { parseCookies } from '../utils/cookie.js';

export async function requireAuth(req, res, next) {
    try {
        const cookies = parseCookies(req.headers.cookie || '');
        const sessionid = cookies['session_id'];

        if (!sessionid) {
            return res.status(401).json({ error: 'Authentification requise' });
        }
        const session = await getSession(sessionid);
        if (!session) {
            return res.status(401).json({ error: 'Session invalide ou expirée' });
        }
        // getSession returns user_id from users.id — expose it as .id for handler compatibility
        req.user = { ...session, id: session.user_id };
        next();
    } catch (err) {
        next(err);
    }
}

// Attach user to req if a valid session exists — runs on every request, non-blocking.
// Used so that public routes (e.g. GET /api/auth/me) can still return user info.
export async function attachUser(req, res, next) {
    try {
        const cookies = parseCookies(req.headers.cookie || '');
        const sessionId = cookies['session_id'];
        if (sessionId) {
            const session = await getSession(sessionId);
            if (session) req.user = { ...session, id: session.user_id };
        }
    } catch (_) { /* ignore — auth failure is non-fatal here */ }
    next();
}

// NOTE: This middleware is currently unused in the router. If you ever use it,
// make sure to import db before calling it. It is kept here for future use.
export function nomUtilisateur(req, res, next) {
    db.get("SELECT username FROM users WHERE id = ?", [req.user.user_id], (err, row) => {
        if (err) return next(err);
        req.user.username = row ? row.username : null;
        next();
    });
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        next();
    };
}
