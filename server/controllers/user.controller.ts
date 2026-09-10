import { Response } from 'express';
import { UserService } from '../services/user.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class UserController {
  private userService = new UserService();

  getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const user = await this.userService.getProfile(req.user!.userId);
      sendSuccess(res, { user });
    } catch (err: any) {
      sendError(res, 'USER_NOT_FOUND', err.message, 404);
    }
  };

  updateMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const updated = await this.userService.updateProfile(req.user!.userId, req.body);
      sendSuccess(res, { user: updated });
    } catch (err: any) {
      sendError(res, 'UPDATE_FAILED', err.message, 400);
    }
  };

  getPreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferences = await this.userService.getPreferences(req.user!.userId);
      sendSuccess(res, { preferences });
    } catch (err: any) {
      sendError(res, 'PREFERENCES_NOT_FOUND', err.message, 404);
    }
  };

  updatePreferences = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const preferences = await this.userService.updatePreferences(req.user!.userId, req.body);
      sendSuccess(res, { preferences });
    } catch (err: any) {
      sendError(res, 'UPDATE_PREFERENCES_FAILED', err.message, 400);
    }
  };
}
