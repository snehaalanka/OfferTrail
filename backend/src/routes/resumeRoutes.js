import express from 'express';
import {
  getResumes,
  createResume,
  updateResume,
  deleteResume,
  setPrimaryResume
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(protect);

router.route('/')
  .get(getResumes)
  .post(createResume);

router.route('/:id')
  .put(updateResume)
  .delete(deleteResume);

router.put('/:id/primary', setPrimaryResume);

export default router;
