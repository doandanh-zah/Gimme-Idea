import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.schemas.js';
import {
  createProject,
  getProjects,
  getProjectById,
  updateProject,
  deleteProject,
  getMyProjects,
} from '../controllers/project.controller.js';

const router = Router();

// Public routes
router.get('/', getProjects);
router.get('/:id', getProjectById);
router.post('/:id/view', (req, res) => res.json({ success: true })); // View count already incremented in getProjectById

// Protected routes (require authentication)
router.post('/', verifyToken, requireRole(['BUILDER', 'BOTH']), validateBody(createProjectSchema), createProject);
router.get('/my/projects', verifyToken, getMyProjects);
router.put('/:id', verifyToken, validateBody(updateProjectSchema), updateProject);
router.delete('/:id', verifyToken, deleteProject);

export default router;
