import type { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response.js';

export async function registerHandler(req: Request, res: Response) {
  // TODO: create user, send verification email
  return sendSuccess(res, { placeholder: true }, 'Registered (stub)');
}

export async function verifyEmailHandler(_req: Request, res: Response) {
  // TODO: verify email token
  return sendSuccess(res, { placeholder: true }, 'Email verified (stub)');
}

export async function loginHandler(_req: Request, res: Response) {
  // TODO: authenticate and issue tokens
  return sendSuccess(res, { accessToken: 'stub', refreshToken: 'stub' }, 'Logged in (stub)');
}

export async function refreshHandler(_req: Request, res: Response) {
  // TODO: rotate refresh token
  return sendSuccess(res, { accessToken: 'stub' }, 'Refreshed (stub)');
}

export async function logoutHandler(_req: Request, res: Response) {
  // TODO: blacklist refresh token
  return sendSuccess(res, {}, 'Logged out (stub)');
}

export async function forgotPasswordHandler(_req: Request, res: Response) {
  // TODO: send reset email
  return sendSuccess(res, {}, 'Reset email sent (stub)');
}

export async function resetPasswordHandler(_req: Request, res: Response) {
  // TODO: reset password
  return sendSuccess(res, {}, 'Password reset (stub)');
}

