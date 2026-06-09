import { Router } from 'express';
import { login, register } from '../handlers/auth.js';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});

router.get('/login.html', (req, res) => {
    res.json({ message: 'API is running' });
});

router.get('/me', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Non connecté' });
  }
  res.json({ user: req.session.user });
});

router.get('/inscription.html', (req, res) => {
    res.json({ message: 'API is running' });
});

router.post('/auth/login', login);
router.post('/auth/inscription', register);

// TODO: add routes as you build them out

export default router;


