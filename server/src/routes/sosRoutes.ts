import { Router } from 'express';
import { getContacts, saveContacts, sendSOS } from '../controllers/sosController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.get('/contacts', authMiddleware, getContacts);
router.post('/contacts', authMiddleware, saveContacts);
router.post('/send', authMiddleware, sendSOS);

export default router;
