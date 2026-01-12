import express from 'express';
import { getPets, getPet, createPet, updatePet, deletePet } from '../controllers/petController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Protect all routes
router.use(protect);

router.route('/')
  .get(getPets)
  .post(createPet);

router.route('/:id')
  .get(getPet)
  .put(updatePet)
  .delete(deletePet);

export default router;

