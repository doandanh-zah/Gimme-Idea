import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message?: string) => {
  return res.json({ success: true, data, ...(message ? { message } : {}) });
};

export const sendError = (res: Response, error: string, code?: string, details?: any, status = 400) => {
  return res.status(status).json({ success: false, error, ...(code ? { code } : {}), ...(details ? { details } : {}) });
};

