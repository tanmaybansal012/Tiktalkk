import express from 'express'
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import { isGroupAdmin } from '../middleware/groupMiddleware';
import {
    createGroup,
    getGroups,
    getGroupMessages,
    sendGroupMessage,
    addMember,
    removeMember,
    promoteToAdmin,
    updateGroup,
    deleteGroup,
    updateGroupPhoto,
} from '../controllers/groupController';

router.post('/', protectRoute, createGroup);
router.get('/', protectRoute, getGroups);
router.get('/:groupId/messages', protectRoute, getGroupMessages);
router.post('/:groupId/messages', protectRoute, sendGroupMessage);
router.post('/:groupId/members', protectRoute, isGroupAdmin, addMember);
router.delete('/:groupId/members/:userId', protectRoute, isGroupAdmin, removeMember);
router.post('/:groupId/admins/:userId', protectRoute, isGroupAdmin, promoteToAdmin);
router.put('/:groupId', protectRoute, isGroupAdmin, updateGroup);
router.put('/:groupId/photo', protectRoute, isGroupAdmin, updateGroupPhoto);
router.delete('/:groupId', protectRoute, isGroupAdmin, deleteGroup);

export default router
