import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

/**
 * Create feedback for a project
 * POST /api/projects/:projectId/feedback
 */
export async function createFeedback(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { projectId } = req.params;
    const { content } = req.body;

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return sendError(res, 'Project not found', 'NOT_FOUND', null, 404);
    }

    // Cannot review own project
    if (project.builderId === req.user.id) {
      return sendError(res, 'Cannot review your own project', 'FORBIDDEN', null, 403);
    }

    // Check if user already gave feedback
    const existingFeedback = await prisma.feedback.findUnique({
      where: {
        projectId_reviewerId: {
          projectId,
          reviewerId: req.user.id,
        },
      },
    });

    if (existingFeedback) {
      return sendError(res, 'You already provided feedback for this project', 'ALREADY_EXISTS', null, 409);
    }

    // Create feedback
    const feedback = await prisma.feedback.create({
      data: {
        projectId,
        reviewerId: req.user.id,
        content,
        status: 'PENDING',
      },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
          },
        },
      },
    });

    logger.info(`Feedback created: ${feedback.id} for project ${projectId} by user ${req.user.id}`);

    return sendSuccess(res, { feedback }, 'Feedback submitted successfully!');
  } catch (error: any) {
    logger.error('Create feedback error:', error);
    return sendError(res, 'Failed to submit feedback', 'CREATE_FAILED', error.message, 500);
  }
}

/**
 * Get all feedback for a project
 * GET /api/projects/:projectId/feedback
 */
export async function getProjectFeedback(req: Request, res: Response) {
  try {
    const { projectId } = req.params;

    const feedback = await prisma.feedback.findMany({
      where: { projectId },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { feedback });
  } catch (error: any) {
    logger.error('Get feedback error:', error);
    return sendError(res, 'Failed to get feedback', 'GET_FAILED', error.message, 500);
  }
}

/**
 * Update feedback (only within 30 minutes)
 * PUT /api/feedback/:id
 */
export async function updateFeedback(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;
    const { content } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return sendError(res, 'Feedback not found', 'NOT_FOUND', null, 404);
    }

    // Check if user is the reviewer
    if (feedback.reviewerId !== req.user.id) {
      return sendError(res, 'Forbidden - You can only update your own feedback', 'FORBIDDEN', null, 403);
    }

    // Check if feedback is still pending
    if (feedback.status !== 'PENDING') {
      return sendError(res, 'Cannot update approved or rejected feedback', 'INVALID_STATUS', null, 400);
    }

    // Check if within 30 minutes
    const now = new Date();
    const createdAt = new Date(feedback.createdAt);
    const diffMinutes = (now.getTime() - createdAt.getTime()) / (1000 * 60);

    if (diffMinutes > 30) {
      return sendError(res, 'Cannot update feedback after 30 minutes', 'TIME_EXPIRED', null, 400);
    }

    const updatedFeedback = await prisma.feedback.update({
      where: { id },
      data: { content },
      include: {
        reviewer: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info(`Feedback updated: ${id} by user ${req.user.id}`);

    return sendSuccess(res, { feedback: updatedFeedback }, 'Feedback updated successfully!');
  } catch (error: any) {
    logger.error('Update feedback error:', error);
    return sendError(res, 'Failed to update feedback', 'UPDATE_FAILED', error.message, 500);
  }
}

/**
 * Delete feedback (reviewer only, within 30 minutes, pending only)
 * DELETE /api/feedback/:id
 */
export async function deleteFeedback(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
    });

    if (!feedback) {
      return sendError(res, 'Feedback not found', 'NOT_FOUND', null, 404);
    }

    if (feedback.reviewerId !== req.user.id) {
      return sendError(res, 'Forbidden - You can only delete your own feedback', 'FORBIDDEN', null, 403);
    }

    if (feedback.status !== 'PENDING') {
      return sendError(res, 'Cannot delete approved or rejected feedback', 'INVALID_STATUS', null, 400);
    }

    await prisma.feedback.delete({
      where: { id },
    });

    logger.info(`Feedback deleted: ${id} by user ${req.user.id}`);

    return sendSuccess(res, {}, 'Feedback deleted successfully!');
  } catch (error: any) {
    logger.error('Delete feedback error:', error);
    return sendError(res, 'Failed to delete feedback', 'DELETE_FAILED', error.message, 500);
  }
}

/**
 * Approve feedback and distribute reward (builder only)
 * POST /api/feedback/:id/approve
 */
export async function approveFeedback(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;
    const { rewardAmount, qualityScore } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        project: true,
        reviewer: true,
      },
    });

    if (!feedback) {
      return sendError(res, 'Feedback not found', 'NOT_FOUND', null, 404);
    }

    // Check if user is the project builder
    if (feedback.project.builderId !== req.user.id) {
      return sendError(res, 'Forbidden - Only project owner can approve feedback', 'FORBIDDEN', null, 403);
    }

    if (feedback.status !== 'PENDING') {
      return sendError(res, 'Feedback already processed', 'ALREADY_PROCESSED', null, 400);
    }

    const reward = parseFloat(rewardAmount);
    const remaining = feedback.project.bountyAmount - feedback.project.bountyDistributed;

    if (reward > remaining) {
      return sendError(res, 'Reward exceeds remaining bounty', 'INSUFFICIENT_BOUNTY', null, 400);
    }

    // Update feedback and project in a transaction
    await prisma.$transaction(async (tx) => {
      // Update feedback
      await tx.feedback.update({
        where: { id },
        data: {
          status: 'APPROVED',
          rewardAmount: reward,
          qualityScore: qualityScore || null,
        },
      });

      // Update project bounty distributed
      await tx.project.update({
        where: { id: feedback.projectId },
        data: {
          bountyDistributed: {
            increment: reward,
          },
        },
      });

      // Update reviewer stats
      await tx.user.update({
        where: { id: feedback.reviewerId },
        data: {
          totalEarned: {
            increment: reward,
          },
          balance: {
            increment: reward,
          },
          reputationScore: {
            increment: qualityScore || 0,
          },
        },
      });

      // Create transaction record
      await tx.transaction.create({
        data: {
          type: 'REWARD',
          fromUserId: feedback.project.builderId,
          toUserId: feedback.reviewerId,
          projectId: feedback.projectId,
          amount: reward,
          status: 'COMPLETED',
          metadata: {
            feedbackId: id,
            qualityScore: qualityScore || 0,
          },
        },
      });
    });

    logger.info(`Feedback approved: ${id}, reward: ${reward}`);

    return sendSuccess(res, {}, 'Feedback approved and reward distributed!');
  } catch (error: any) {
    logger.error('Approve feedback error:', error);
    return sendError(res, 'Failed to approve feedback', 'APPROVE_FAILED', error.message, 500);
  }
}

/**
 * Reject feedback (builder only)
 * POST /api/feedback/:id/reject
 */
export async function rejectFeedback(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;
    const { reason } = req.body;

    const feedback = await prisma.feedback.findUnique({
      where: { id },
      include: {
        project: true,
      },
    });

    if (!feedback) {
      return sendError(res, 'Feedback not found', 'NOT_FOUND', null, 404);
    }

    if (feedback.project.builderId !== req.user.id) {
      return sendError(res, 'Forbidden - Only project owner can reject feedback', 'FORBIDDEN', null, 403);
    }

    if (feedback.status !== 'PENDING') {
      return sendError(res, 'Feedback already processed', 'ALREADY_PROCESSED', null, 400);
    }

    await prisma.feedback.update({
      where: { id },
      data: {
        status: 'REJECTED',
      },
    });

    logger.info(`Feedback rejected: ${id}, reason: ${reason || 'none'}`);

    return sendSuccess(res, {}, 'Feedback rejected');
  } catch (error: any) {
    logger.error('Reject feedback error:', error);
    return sendError(res, 'Failed to reject feedback', 'REJECT_FAILED', error.message, 500);
  }
}
