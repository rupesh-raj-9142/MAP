import { Response } from 'express';
import { AuthService } from '../services/auth.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AuthController {
  private authService = new AuthService();

  register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.authService.register(req.body);
      sendSuccess(res, result, 201);
    } catch (err: any) {
      if (err.message?.includes('USER_EXISTS')) {
        sendError(res, 'USER_EXISTS', 'An account with this email already exists', 409);
        return;
      }
      sendError(res, 'REGISTRATION_FAILED', err.message || 'Registration failed', 400);
    }
  };

  login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const result = await this.authService.login(req.body);
      sendSuccess(res, result, 200);
    } catch (err: any) {
      sendError(res, 'INVALID_CREDENTIALS', 'Invalid email or password', 401);
    }
  };

  logout = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    // JWT stateless logout - clients discard their token
    sendSuccess(res, { message: 'Logged out successfully' });
  };

  me = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        sendError(res, 'UNAUTHORIZED', 'Authentication required', 401);
        return;
      }
      const user = await this.authService.getCurrentUser(req.user.userId);
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, 'USER_NOT_FOUND', err.message || 'User not found', 404);
    }
  };
}
