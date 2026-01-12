import express from 'express';
import {
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentStats
} from '../controllers/adminAppointmentController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(adminProtect);

router.get('/stats', getAppointmentStats);
router.get('/', getAllAppointments);
router.put('/:id/status', updateAppointmentStatus);

export default router;
