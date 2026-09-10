import { Request, Response } from 'express';
import { LocationService } from '../services/location.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class LocationController {
  private locationService = new LocationService();

  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const query = (req.query.query || req.query.q) as string;
      if (!query || query.trim().length < 2) {
        sendError(res, 'INVALID_QUERY', 'Search query must be at least 2 characters', 400);
        return;
      }
      const results = await this.locationService.searchLocation(query.trim());
      sendSuccess(res, { results });
    } catch (err: any) {
      sendError(res, 'LOCATION_SEARCH_FAILED', err.message || 'Location search failed', 500);
    }
  };
}
