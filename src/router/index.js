import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
    res.json({ message: 'API is running' });
});


// TODO: add routes as you build them out

export default router;