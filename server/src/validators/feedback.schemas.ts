import { z } from 'zod';

export const createFeedbackSchema = z.object({
  content: z.object({
    overall: z.string().min(10, 'Overall feedback must be at least 10 characters'),
    pros: z.array(z.string()).min(1, 'At least one pro is required'),
    cons: z.array(z.string()).optional(),
    suggestions: z.string().optional(),
  }),
});

export const updateFeedbackSchema = z.object({
  content: z.object({
    overall: z.string().min(10).optional(),
    pros: z.array(z.string()).optional(),
    cons: z.array(z.string()).optional(),
    suggestions: z.string().optional(),
  }),
});

export const approveFeedbackSchema = z.object({
  rewardAmount: z.number().min(0, 'Reward must be positive').or(z.string()),
  qualityScore: z.number().min(1).max(5).optional(),
});

export const rejectFeedbackSchema = z.object({
  reason: z.string().optional(),
});
