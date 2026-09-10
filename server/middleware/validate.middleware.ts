import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        sendError(res, 'VALIDATION_ERROR', `Invalid request body: ${issues}`, 400, err.issues);
        return;
      }
      sendError(res, 'VALIDATION_ERROR', 'Invalid request body', 400);
    }
  };
}

export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as any;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ');
        sendError(res, 'VALIDATION_ERROR', `Invalid query parameters: ${issues}`, 400, err.issues);
        return;
      }
      sendError(res, 'VALIDATION_ERROR', 'Invalid query parameters', 400);
    }
  };
}
