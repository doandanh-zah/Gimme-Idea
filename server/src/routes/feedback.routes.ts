import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validation.js';
import { feedbackLimiter } from '../middleware/rateLimiter.js';
import {
  createFeedbackSchema,
  updateFeedbackSchema,
  approveFeedbackSchema,
  rejectFeedbackSchema,
} from '../validators/feedback.schemas.js';
import {
  createFeedback,
  getProjectFeedback,
  updateFeedback,
  deleteFeedback,
  approveFeedback,
  rejectFeedback,
} from '../controllers/feedback.controller.js';

const router = Router();

// Feedback on projects
router.post(
  '/projects/:projectId/feedback',
  verifyToken,
  requireRole(['REVIEWER', 'BOTH']),
  feedbackLimiter,
  validateBody(createFeedbackSchema),
  createFeedback,
);
router.get('/projects/:projectId/feedback', getProjectFeedback);

// Manage individual feedback
router.put('/feedback/:id', verifyToken, validateBody(updateFeedbackSchema), updateFeedback);
router.delete('/feedback/:id', verifyToken, deleteFeedback);

// Approve/reject feedback (builder only)
router.post('/feedback/:id/approve', verifyToken, validateBody(approveFeedbackSchema), approveFeedback);
router.post('/feedback/:id/reject', verifyToken, validateBody(rejectFeedbackSchema), rejectFeedback);

export default router;
