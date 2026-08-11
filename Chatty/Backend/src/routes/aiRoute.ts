import express from 'express';
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import { getSmartReplies, summarizeUserChat, summarizeGroupChat } from '../controllers/aiController';

router.post('/smart-replies', protectRoute, getSmartReplies);
router.get('/summary/user/:userId', protectRoute, summarizeUserChat);
router.get('/summary/group/:groupId', protectRoute, summarizeGroupChat);

export default router;
