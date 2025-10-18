import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';
import logger from '../utils/logger.js';

export interface AuthUser {
  id: string;
  email: string;
  role: 'BUILDER' | 'REVIEWER' | 'BOTH';
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

/**
 * Middleware to verify JWT access token
 * Attaches user info to req.user
 */
export function verifyToken(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return sendError(res, 'No token provided', 'UNAUTHORIZED', null, 401);
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: AuthUser['role'];
    };

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return sendError(res, 'Token has expired', 'TOKEN_EXPIRED', null, 401);
    }
    if (error instanceof jwt.JsonWebTokenError) {
      return sendError(res, 'Invalid token', 'INVALID_TOKEN', null, 401);
    }

    logger.error('Token verification error:', error);
    return sendError(res, 'Token verification failed', 'VERIFICATION_FAILED', null, 401);
  }
}

/**
 * Middleware to require specific user roles
 * Must be used AFTER verifyToken middleware
 */
export function requireRole(roles: AuthUser['role'][]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendError(res, 'Unauthorized - No user found', 'UNAUTHORIZED', null, 401);
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Forbidden - Requires one of: ${roles.join(', ')}`,
        'FORBIDDEN',
        null,
        403,
      );
    }

    next();
  };
}

/**
 * Middleware to optionally attach user if token is present
 * Does not fail if token is missing/invalid
 */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    return next();
  }

  const token = header.split(' ')[1];

  try {
    const secret = process.env.JWT_SECRET as string;
    const payload = jwt.verify(token, secret) as {
      userId: string;
      email: string;
      role: AuthUser['role'];
    };

    req.user = {
      id: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch (error) {
    // Silently fail for optional auth
    logger.debug('Optional auth failed:', error);
  }

  next();
}

