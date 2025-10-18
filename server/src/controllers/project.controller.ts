import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';
import prisma from '../prisma/client.js';
import logger from '../utils/logger.js';

/**
 * Create new project
 * POST /api/projects
 */
export async function createProject(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { title, description, demoUrl, repoUrl, category, tags, bountyAmount, deadline } = req.body;

    // Convert deadline string to Date
    const deadlineDate = new Date(deadline);

    // Validate deadline is in future
    if (deadlineDate <= new Date()) {
      return sendError(res, 'Deadline must be in the future', 'INVALID_DEADLINE', null, 400);
    }

    const project = await prisma.project.create({
      data: {
        builderId: req.user.id,
        title,
        description,
        demoUrl,
        repoUrl: repoUrl || null,
        category,
        tags,
        bountyAmount: parseFloat(bountyAmount),
        deadline: deadlineDate,
        status: 'ACTIVE',
      },
      include: {
        builder: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            reputationScore: true,
          },
        },
      },
    });

    logger.info(`Project created: ${project.id} by user ${req.user.id}`);

    return sendSuccess(res, { project }, 'Project created successfully!');
  } catch (error: any) {
    logger.error('Create project error:', error);
    return sendError(res, 'Failed to create project', 'CREATE_FAILED', error.message, 500);
  }
}

/**
 * Get all projects with filters
 * GET /api/projects?status=ACTIVE&category=web&page=1&limit=10
 */
export async function getProjects(req: Request, res: Response) {
  try {
    const {
      status,
      category,
      search,
      page = '1',
      limit = '10',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Build where clause
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Get total count
    const total = await prisma.project.count({ where });

    // Get projects
    const projects = await prisma.project.findMany({
      where,
      include: {
        builder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            reputationScore: true,
          },
        },
        feedback: {
          select: {
            id: true,
            status: true,
          },
        },
      },
      orderBy: {
        [sortBy as string]: sortOrder,
      },
      skip,
      take: limitNum,
    });

    return sendSuccess(res, {
      projects,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
      },
    });
  } catch (error: any) {
    logger.error('Get projects error:', error);
    return sendError(res, 'Failed to get projects', 'GET_FAILED', error.message, 500);
  }
}

/**
 * Get project by ID
 * GET /api/projects/:id
 */
export async function getProjectById(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        builder: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
            reputationScore: true,
          },
        },
        feedback: {
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
        },
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 'NOT_FOUND', null, 404);
    }

    // Increment view count (optional: track by IP/user to prevent spam)
    await prisma.project.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    return sendSuccess(res, { project });
  } catch (error: any) {
    logger.error('Get project error:', error);
    return sendError(res, 'Failed to get project', 'GET_FAILED', error.message, 500);
  }
}

/**
 * Update project
 * PUT /api/projects/:id
 */
export async function updateProject(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;
    const { title, description, demoUrl, repoUrl, category, tags, bountyAmount, deadline, status } =
      req.body;

    // Check if project exists and user is owner
    const existingProject = await prisma.project.findUnique({
      where: { id },
    });

    if (!existingProject) {
      return sendError(res, 'Project not found', 'NOT_FOUND', null, 404);
    }

    if (existingProject.builderId !== req.user.id) {
      return sendError(res, 'Forbidden - You can only update your own projects', 'FORBIDDEN', null, 403);
    }

    // Build update data
    const updateData: any = {};

    if (title) updateData.title = title;
    if (description) updateData.description = description;
    if (demoUrl) updateData.demoUrl = demoUrl;
    if (repoUrl !== undefined) updateData.repoUrl = repoUrl;
    if (category) updateData.category = category;
    if (tags) updateData.tags = tags;
    if (bountyAmount) updateData.bountyAmount = parseFloat(bountyAmount);
    if (status) updateData.status = status;

    if (deadline) {
      const deadlineDate = new Date(deadline);
      if (deadlineDate <= new Date()) {
        return sendError(res, 'Deadline must be in the future', 'INVALID_DEADLINE', null, 400);
      }
      updateData.deadline = deadlineDate;
    }

    const project = await prisma.project.update({
      where: { id },
      data: updateData,
      include: {
        builder: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    logger.info(`Project updated: ${project.id} by user ${req.user.id}`);

    return sendSuccess(res, { project }, 'Project updated successfully!');
  } catch (error: any) {
    logger.error('Update project error:', error);
    return sendError(res, 'Failed to update project', 'UPDATE_FAILED', error.message, 500);
  }
}

/**
 * Delete project
 * DELETE /api/projects/:id
 */
export async function deleteProject(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const { id } = req.params;

    // Check if project exists and user is owner
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        feedback: true,
      },
    });

    if (!project) {
      return sendError(res, 'Project not found', 'NOT_FOUND', null, 404);
    }

    if (project.builderId !== req.user.id) {
      return sendError(res, 'Forbidden - You can only delete your own projects', 'FORBIDDEN', null, 403);
    }

    // Check if project has approved feedback (prevent deletion if bounty distributed)
    const hasApprovedFeedback = project.feedback.some((f) => f.status === 'APPROVED');
    if (hasApprovedFeedback) {
      return sendError(
        res,
        'Cannot delete project with approved feedback',
        'HAS_APPROVED_FEEDBACK',
        null,
        400,
      );
    }

    await prisma.project.delete({
      where: { id },
    });

    logger.info(`Project deleted: ${id} by user ${req.user.id}`);

    return sendSuccess(res, {}, 'Project deleted successfully!');
  } catch (error: any) {
    logger.error('Delete project error:', error);
    return sendError(res, 'Failed to delete project', 'DELETE_FAILED', error.message, 500);
  }
}

/**
 * Get user's own projects
 * GET /api/projects/my
 */
export async function getMyProjects(req: Request, res: Response) {
  try {
    if (!req.user) {
      return sendError(res, 'Unauthorized', 'UNAUTHORIZED', null, 401);
    }

    const projects = await prisma.project.findMany({
      where: { builderId: req.user.id },
      include: {
        feedback: {
          select: {
            id: true,
            status: true,
            createdAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, { projects });
  } catch (error: any) {
    logger.error('Get my projects error:', error);
    return sendError(res, 'Failed to get projects', 'GET_FAILED', error.message, 500);
  }
}
