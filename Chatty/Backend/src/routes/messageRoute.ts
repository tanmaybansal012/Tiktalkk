import express from 'express'
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import { getUsersForSidebar, getMessages, sendMessages } from '../controllers/messageController';

router.get('/users', protectRoute, getUsersForSidebar);
router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, sendMessages);

export default router