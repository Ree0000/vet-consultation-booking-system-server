import express from 'express';
import {
  getAllUsers,
  getUserDetails,
  updateUser,
  resetUserPassword
} from '../controllers/adminUserController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(adminProtect);

router.get('/', getAllUsers);
router.get('/:id', getUserDetails);
router.put('/:id', updateUser);
router.post('/:id/reset-password', resetUserPassword);

export default router;
