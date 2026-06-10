import { authentification, addUser, userExists, logout } from '../services/auth.js';
import { validateRegister } from '../utils/validate.js';
import { buildCookie, buildExpireCookie, parseCookies } from '../utils/cookie.js';

export async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }
    const result = await authentification(username, password);
    if (!result.success) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    res.setHeader('Set-Cookie', buildCookie('session_id', result.sessionId, { maxAge: 7 * 24 * 60 * 60, } ));

    res.json({ message: 'logged in', user: result.user });
  } catch (error) {
    next(error);
  }
}

export async function register(req, res, next) {
    try {
        const { username, email, password } = req.body;
        const errors = validateRegister({ username, email, password });
        if (errors.length) return res.status(400).json({ errors });

        if (await userExists(username))
            return res.status(409).json({ error: "Nom d'utilisateur déjà pris" });

        const user = await addUser(username, email, password);
        res.status(201).json({ message: 'Compte créé !', id: user.id });
    } catch (err) { next(err); }
}

export async function logoutHandler(req, res, next) {
    try {
        const cookies = parseCookies(req.headers.cookie || '');
        const sessionId = cookies['session_id'];
        if (sessionId) await logout(sessionId);
        res.setHeader('Set-Cookie', buildExpireCookie('session_id'));
        res.json({ message: 'Logged out' });
    } catch (err) { next(err); }
}

export async function me(req, res) {
    res.json({ user: req.user });
}