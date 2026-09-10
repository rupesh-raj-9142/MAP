import { Response } from 'express';
import { TripService } from '../services/trip.service.js';
import { YatraLiveService } from '../services/yatraLive.service.js';
import { AuthenticatedRequest } from '../middleware/auth.middleware.js';
import { sendSuccess, sendError } from '../utils/response.js';

export class TripsController {
  private tripService = new TripService();
  private yatraLiveService = new YatraLiveService();

  createTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const trip = await this.tripService.createTrip(userId, req.body);
      sendSuccess(res, { trip }, 201);
    } catch (err: any) {
      sendError(res, 'CREATE_TRIP_FAILED', err.message, 400);
    }
  };

  getTrips = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const trips = await this.tripService.getTripsByUser(userId);
      sendSuccess(res, { trips, count: trips.length });
    } catch (err: any) {
      sendError(res, 'GET_TRIPS_FAILED', err.message, 500);
    }
  };

  getTripById = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const trip = await this.tripService.getTripById(req.params.id, userId);
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'TRIP_NOT_FOUND', err.message, 404);
    }
  };

  updateTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const updated = await this.tripService.updateTrip(req.params.id, userId, req.body);
      sendSuccess(res, { trip: updated });
    } catch (err: any) {
      sendError(res, 'UPDATE_TRIP_FAILED', err.message, 400);
    }
  };

  deleteTrip = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      await this.tripService.deleteTrip(req.params.id, userId);
      sendSuccess(res, { message: 'Trip deleted successfully' });
    } catch (err: any) {
      sendError(res, 'DELETE_TRIP_FAILED', err.message, 400);
    }
  };

  addStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const { tripId } = req.params;
      const { placeId, durationMinutes } = req.body;
      const trip = await this.tripService.addStop(tripId, userId, placeId, durationMinutes);
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'ADD_STOP_FAILED', err.message, 400);
    }
  };

  updateStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const { tripId, stopId } = req.params;
      const trip = await this.tripService.updateStop(tripId, userId, stopId, req.body);
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'UPDATE_STOP_FAILED', err.message, 400);
    }
  };

  removeStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const { tripId, stopId } = req.params;
      const trip = await this.tripService.removeStop(tripId, userId, stopId);
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'REMOVE_STOP_FAILED', err.message, 400);
    }
  };

  replaceStop = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const { tripId, stopId } = req.params;
      const { newPlaceId } = req.body;
      const trip = await this.tripService.replaceStop(tripId, userId, stopId, newPlaceId);
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'REPLACE_STOP_FAILED', err.message, 400);
    }
  };

  recalculate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
    try {
      const userId = req.user?.userId || 'guest-user';
      const { tripId } = req.params;
      const trip = await this.yatraLiveService.recalculateLiveItinerary(tripId, userId, req.body || {});
      sendSuccess(res, { trip });
    } catch (err: any) {
      sendError(res, 'RECALCULATE_FAILED', err.message, 400);
    }
  };
}
