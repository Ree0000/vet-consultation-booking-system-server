import express from 'express';
import {
  getAllVeterinarians,
  createVeterinarian,
  updateVeterinarian,
  toggleVeterinarianAvailability,
  deleteVeterinarian
} from '../controllers/adminVeterinarianController.js';
import { adminProtect } from '../middleware/adminMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(adminProtect);

router.route('/')
  .get(getAllVeterinarians)
  .post(createVeterinarian);

router.route('/:id')
  .put(updateVeterinarian)
  .delete(deleteVeterinarian);

router.patch('/:id/availability', toggleVeterinarianAvailability);

export default router;
