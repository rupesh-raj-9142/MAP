import { Response } from 'express';
import { AITripPlannerService } from '../services/aiTripPlanner.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class AIController {
  private aiPlanner = new AITripPlannerService();

  planTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const trip = await this.aiPlanner.planTrip(userId, req.body);
      sendSuccess(res, { trip }, 201);
    } catch (err: any) {
      if (err.name === 'ZodError') {
        sendError(res, 'VALIDATION_ERROR', 'Invalid AI plan request schema', 400, err.issues);
        return;
      }
      sendError(res, 'AI_PLAN_FAILED', err.message || 'AI trip planning failed', 500);
    }
  };
}
