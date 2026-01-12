import express from 'express';
import { adminLogin, getAdminMe } from '../controllers/adminAuthController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

router.post('/login', adminLogin);
router.get('/me', adminProtect, getAdminMe);

export default router;
