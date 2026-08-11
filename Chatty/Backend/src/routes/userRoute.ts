import express from 'express'
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import {
    searchUsers,
    getFriends,
    getFriendRequests,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    unfriend,
} from '../controllers/userController';

router.get('/search', protectRoute, searchUsers);
router.get('/friends', protectRoute, getFriends);
router.get('/friend-requests', protectRoute, getFriendRequests);
router.post('/friend-request/:userId', protectRoute, sendFriendRequest);
router.post('/friend-request/:userId/accept', protectRoute, acceptFriendRequest);
router.post('/friend-request/:userId/reject', protectRoute, rejectFriendRequest);
router.delete('/friend/:userId', protectRoute, unfriend);

export default router
