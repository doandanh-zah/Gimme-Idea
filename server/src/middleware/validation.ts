import type { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { sendError } from '../utils/response.js';

export const validateBody = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.body);
  if (!parsed.success) {
    return sendError(res, 'Validation error', 'VALIDATION_ERROR', parsed.error.format(), 422);
  }
  req.body = parsed.data;
  next();
};

export const validateQuery = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.query);
  if (!parsed.success) {
    return sendError(res, 'Validation error', 'VALIDATION_ERROR', parsed.error.format(), 422);
  }
  req.query = parsed.data as any;
  next();
};

export const validateParams = (schema: ZodSchema) => (req: Request, res: Response, next: NextFunction) => {
  const parsed = schema.safeParse(req.params);
  if (!parsed.success) {
    return sendError(res, 'Validation error', 'VALIDATION_ERROR', parsed.error.format(), 422);
  }
  req.params = parsed.data as any;
  next();
};

