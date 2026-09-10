import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.js';
import { logger } from '../utils/logger.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error(`Unhandled request error [${req.method} ${req.path}]:`, err?.message || err);

  // Map known error patterns
  const message = err?.message || 'An unexpected internal error occurred';
  if (message.startsWith('NOT_FOUND:')) {
    sendError(res, 'NOT_FOUND', message.replace('NOT_FOUND:', '').trim(), 404);
    return;
  }
  if (message.startsWith('UNAUTHORIZED:')) {
    sendError(res, 'UNAUTHORIZED', message.replace('UNAUTHORIZED:', '').trim(), 401);
    return;
  }
  if (message.startsWith('USER_EXISTS:')) {
    sendError(res, 'USER_EXISTS', message.replace('USER_EXISTS:', '').trim(), 409);
    return;
  }
  if (message.startsWith('INVALID_CREDENTIALS:')) {
    sendError(res, 'INVALID_CREDENTIALS', message.replace('INVALID_CREDENTIALS:', '').trim(), 401);
    return;
  }
  if (message.startsWith('NO_PLACES:')) {
    sendError(res, 'NO_PLACES', message.replace('NO_PLACES:', '').trim(), 404);
    return;
  }

  // Never expose stack trace in production or API responses
  sendError(res, 'INTERNAL_SERVER_ERROR', 'A server error occurred. Please try again.', 500);
}
