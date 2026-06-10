import {getSession} from '../repository/session.js';
import {parseCookies} from '../utils/cookie.js';

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
        req.session = session;
        next();
    } catch (err) {
        next(err);
    }
}

export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.session || !roles.includes(req.session.role)) {
            return res.status(403).json({ error: 'Accès refusé' });
        }
        next();
    };
}