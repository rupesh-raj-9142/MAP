import { Request, Response } from 'express';
import { RoutesService } from '../services/routes.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class RoutesController {
  private routesService = new RoutesService();

  calculateRoute = async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await this.routesService.calculateRoute(req.body);
      sendSuccess(res, { route: result });
    } catch (err: any) {
      sendError(res, 'ROUTE_CALCULATION_FAILED', err.message || 'Route calculation failed', 500);
    }
  };
}
