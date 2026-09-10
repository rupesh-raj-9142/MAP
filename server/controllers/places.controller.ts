import { Request, Response } from 'express';
import { PlacesService } from '../services/places.service.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class PlacesController {
  private placesService = new PlacesService();

  getNearby = async (req: Request, res: Response): Promise<void> => {
    try {
      const { latitude, longitude, radius, category, page, limit } = req.query as any;

      const places = await this.placesService.getNearbyPlaces({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radiusMeters: radius ? parseInt(radius, 10) : 10000,
        category: category as string,
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20
      });

      sendSuccess(res, {
        places,
        count: places.length,
        radiusMeters: radius ? parseInt(radius, 10) : 10000
      });
    } catch (err: any) {
      sendError(res, 'NEARBY_PLACES_FAILED', err.message || 'Failed to retrieve nearby places', 500);
    }
  };

  /**
   * AI-driven place discovery for any searched location or city
   */
  aiDiscover = async (req: Request, res: Response): Promise<void> => {
    try {
      const location = (req.query.location || req.query.q || req.query.city) as string;
      if (!location || location.trim().length === 0) {
        sendError(res, 'INVALID_LOCATION', 'Location parameter is required for AI discovery', 400);
        return;
      }

      const category = req.query.category as string | undefined;
      const results = await this.placesService.discoverPlacesWithAI(location.trim(), category);

      sendSuccess(res, {
        results,
        count: results.length,
        location: location.trim(),
        model: process.env.GEMINI_MODEL || 'gemini-3.6-flash'
      });
    } catch (err: any) {
      sendError(res, 'AI_DISCOVERY_FAILED', err.message || 'AI place discovery failed', 500);
    }
  };

  getById = async (req: Request, res: Response): Promise<void> => {
    try {
      const id = req.params.id;
      const place = await this.placesService.getPlaceDetails(id);
      if (!place) {
        sendError(res, 'PLACE_NOT_FOUND', `Place with id '${id}' not found`, 404);
        return;
      }
      sendSuccess(res, { place });
    } catch (err: any) {
      sendError(res, 'PLACE_DETAILS_FAILED', err.message || 'Failed to retrieve place details', 500);
    }
  };

  search = async (req: Request, res: Response): Promise<void> => {
    try {
      const q = (req.query.q || req.query.query) as string;
      if (!q || q.trim().length === 0) {
        sendError(res, 'INVALID_SEARCH', 'Search query cannot be empty', 400);
        return;
      }

      const city = req.query.city as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20;
      const forceAi = req.query.ai === 'true';

      const results = await this.placesService.searchPlaces(q.trim(), city, limit, forceAi);
      sendSuccess(res, {
        results,
        count: results.length
      });
    } catch (err: any) {
      sendError(res, 'SEARCH_FAILED', err.message || 'Place search failed', 500);
    }
  };
}
