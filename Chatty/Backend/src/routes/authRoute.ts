import express from 'express'
const router = express.Router();
import { protectRoute } from '../middleware/authMiddleware';
import { signup, login, logout, updateProfile, checkAuth } from '../controllers/authController';
import upload from '../lib/multer';

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', logout);
router.put('/update-profile', protectRoute,upload.single("image"), updateProfile);
router.get('/check', protectRoute, checkAuth);

export default router