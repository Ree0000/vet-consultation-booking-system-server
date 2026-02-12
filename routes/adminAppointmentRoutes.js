import express from 'express';
import {
  getAllAppointments,
  updateAppointmentStatus,
  getAppointmentStats,
  getAvailableSlotsForVet,
  createManualAppointment,
  deleteManualAppointment
} from '../controllers/adminAppointmentController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(adminProtect);

router.get('/stats', getAppointmentStats);
router.get('/available-slots', getAvailableSlotsForVet);
router.get('/', getAllAppointments);
router.put('/:id/status', updateAppointmentStatus);

// Manual booking routes
router.post('/manual', createManualAppointment);
router.delete('/manual/:id', deleteManualAppointment);

export default router;
