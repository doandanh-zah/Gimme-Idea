import type { NextFunction, Request, Response } from 'express';
import logger from '../utils/logger.js';
import { sendError } from '../utils/response.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  logger.error(`${status} - ${message}`);
  return sendError(res, message, undefined, process.env.NODE_ENV === 'development' ? err : undefined, status);
}

