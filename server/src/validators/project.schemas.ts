import { z } from 'zod';

export const createProjectSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  demoUrl: z.string().url('Invalid demo URL'),
  repoUrl: z.string().url('Invalid repository URL').optional().or(z.literal('')),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).min(1, 'At least one tag is required'),
  bountyAmount: z.number().min(0, 'Bounty amount must be positive').or(z.string()),
  deadline: z.string().datetime().or(z.date()),
});

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  demoUrl: z.string().url().optional(),
  repoUrl: z.string().url().optional().or(z.literal('')),
  category: z.string().optional(),
  tags: z.array(z.string()).optional(),
  bountyAmount: z.number().min(0).or(z.string()).optional(),
  deadline: z.string().datetime().or(z.date()).optional(),
  status: z.enum(['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional(),
});
