import express from 'express'
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import { getUsersForSidebar, getMessages, sendMessages, editMessage, deleteMessage } from '../controllers/messageController';

router.get('/users', protectRoute, getUsersForSidebar);
router.get('/:id', protectRoute, getMessages);
router.post('/send/:id', protectRoute, sendMessages);
router.put('/:id', protectRoute, editMessage);
router.delete('/:id', protectRoute, deleteMessage);

export default router