import { Response } from 'express';
import { SavedPlaceService } from '../services/savedPlace.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class SavedPlacesController {
  private savedPlaceService = new SavedPlaceService();

  save = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const placeId = req.body.placeId;
      if (!placeId) {
        sendError(res, 'INVALID_REQUEST', 'placeId is required', 400);
        return;
      }
      const saved = await this.savedPlaceService.savePlace(userId, placeId);
      sendSuccess(res, { saved }, 201);
    } catch (err: any) {
      sendError(res, 'SAVE_PLACE_FAILED', err.message, 400);
    }
  };

  getAll = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const places = await this.savedPlaceService.getSavedPlaces(userId);
      sendSuccess(res, { places, count: places.length });
    } catch (err: any) {
      sendError(res, 'GET_SAVED_PLACES_FAILED', err.message, 500);
    }
  };

  remove = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const placeId = req.params.placeId;
      await this.savedPlaceService.removeSavedPlace(userId, placeId);
      sendSuccess(res, { message: 'Place removed from saved destinations' });
    } catch (err: any) {
      sendError(res, 'REMOVE_SAVED_PLACE_FAILED', err.message, 400);
    }
  };
}
