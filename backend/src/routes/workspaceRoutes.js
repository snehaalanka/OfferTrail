import express from 'express';
import {
  getTopics,
  createTopic,
  updateTopic,
  deleteTopic,
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  getNotes,
  createNote,
  updateNote,
  deleteNote
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Apply auth middleware to protect all routes
router.use(protect);

// 1. Learning Topics
router.route('/topics')
  .get(getTopics)
  .post(createTopic);

router.route('/topics/:id')
  .put(updateTopic)
  .delete(deleteTopic);

// 2. Projects
router.route('/projects')
  .get(getProjects)
  .post(createProject);

router.route('/projects/:id')
  .put(updateProject)
  .delete(deleteProject);

// 3. Cheat Sheet Notes
router.route('/notes')
  .get(getNotes)
  .post(createNote);

router.route('/notes/:id')
  .put(updateNote)
  .delete(deleteNote);

export default router;
