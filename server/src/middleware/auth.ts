import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

export interface AuthUser {
  id: string;
  role: 'builder' | 'reviewer' | 'both';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 'Unauthorized', 'UNAUTHORIZED', undefined, 401);
  }
  const token = header.split(' ')[1];
  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as { sub: string; role: AuthUser['role'] };
    req.user = { id: payload.sub, role: payload.role };
    next();
  } catch (e) {
    return sendError(res, 'Invalid token', 'INVALID_TOKEN', undefined, 401);
  }
}

export function requireRole(roles: AuthUser['role'][]){
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) return sendError(res, 'Unauthorized', 'UNAUTHORIZED', undefined, 401);
    if (!roles.includes(req.user.role)) return sendError(res, 'Forbidden', 'FORBIDDEN', undefined, 403);
    next();
  };
}

// Placeholder for refresh token rotation (to be implemented with Redis)
export function refreshToken(_req: Request, _res: Response, next: NextFunction) {
  // TODO: implement using Redis token store and rotation
  next();
}

