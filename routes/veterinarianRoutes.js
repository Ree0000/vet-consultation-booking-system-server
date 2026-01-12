import express from 'express';
import { getVeterinarians, getAvailableVet } from '../controllers/veterinarianController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/', getVeterinarians);
router.get('/available', getAvailableVet);

export default router;
