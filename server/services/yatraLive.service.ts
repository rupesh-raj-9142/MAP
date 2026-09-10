import { TripModel, TripStopModel, PlaceModel } from '../../types/index.js';
import { TripService } from './trip.service.js';
import { PlacesService } from './places.service.js';
import { RouteOptimizationService } from './routeOptimization.service.js';

export interface YatraLiveRecalculateRequest {
  reason?: 'PLACE_UNAVAILABLE' | 'USER_RUNNING_LATE' | 'TRAFFIC_CHANGE' | 'TIME_REDUCED' | 'BUDGET_CHANGED' | 'STOP_SKIPPED' | 'WEATHER_CHANGE';
  affectedStopId?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  remainingTimeMinutes?: number;
  remainingBudget?: number;
}

export class YatraLiveService {
  private tripService: TripService;
  private placesService: PlacesService;
  private routeOptService: RouteOptimizationService;

  constructor(
    tripService?: TripService,
    placesService?: PlacesService,
    routeOptService?: RouteOptimizationService
  ) {
    this.tripService = tripService || new TripService();
    this.placesService = placesService || new PlacesService();
    this.routeOptService = routeOptService || new RouteOptimizationService();
  }

  async recalculateLiveItinerary(
    tripId: string,
    userId: string,
    params: YatraLiveRecalculateRequest
  ): Promise<TripModel> {
    const trip = await this.tripService.getTripById(tripId, userId);
    const reason = params.reason || 'PLACE_UNAVAILABLE';

    // 1. Identify completed vs remaining stops
    const completedStops = trip.stops.filter(s => s.status === 'COMPLETED');
    let remainingStops = trip.stops.filter(s => s.status !== 'COMPLETED');

    if (reason === 'PLACE_UNAVAILABLE') {
      // Identify which stop to replace: either explicitly specified, or the first pending/current stop
      const targetStop = params.affectedStopId
        ? remainingStops.find(s => s.id === params.affectedStopId || s.placeId === params.affectedStopId)
        : remainingStops[0];

      if (targetStop) {
        // Find alternative place nearby
        const currentCoord = params.currentLocation || {
          latitude: trip.latitude,
          longitude: trip.longitude
        };

        const existingPlaceIds = new Set(trip.stops.map(s => s.placeId));
        const alternatives = await this.placesService.getNearbyPlaces({
          latitude: currentCoord.latitude,
          longitude: currentCoord.longitude,
          radiusMeters: 15000,
          limit: 10
        });

        const suitableAlternative = alternatives.find(a => !existingPlaceIds.has(a.id));

        if (suitableAlternative) {
          // Replace the target stop
          targetStop.placeId = suitableAlternative.id;
          targetStop.place = suitableAlternative;
          targetStop.durationMinutes = suitableAlternative.recommendedDuration || 45;
          targetStop.status = 'REPLACED';
          targetStop.notes = `YATRA LIVE: Replaced unavailable stop with ${suitableAlternative.name}`;
        }
      }
    } else if (reason === 'STOP_SKIPPED') {
      const targetStop = params.affectedStopId
        ? remainingStops.find(s => s.id === params.affectedStopId || s.placeId === params.affectedStopId)
        : remainingStops[0];
      if (targetStop) {
        targetStop.status = 'SKIPPED';
        targetStop.durationMinutes = 0;
      }
    } else if (reason === 'TIME_REDUCED' || reason === 'USER_RUNNING_LATE') {
      // Compress dwell time by 20% on remaining stops
      for (const stop of remainingStops) {
        if (stop.status === 'PENDING') {
          stop.durationMinutes = Math.max(25, Math.round(stop.durationMinutes * 0.8));
        }
      }
    }

    // 2. Re-optimize the order of remaining pending stops
    const activePendingStops = remainingStops.filter(s => s.status !== 'SKIPPED');
    if (activePendingStops.length > 1) {
      const pendingPlaces: PlaceModel[] = [];
      for (const s of activePendingStops) {
        if (s.place) pendingPlaces.push(s.place);
      }

      if (pendingPlaces.length > 1) {
        const startCoord = params.currentLocation || {
          latitude: activePendingStops[0].place?.latitude || trip.latitude,
          longitude: activePendingStops[0].place?.longitude || trip.longitude
        };

        const reordered = this.routeOptService.optimizeStopOrder(startCoord, pendingPlaces);
        activePendingStops.forEach((stop, idx) => {
          stop.place = reordered[idx];
          stop.placeId = reordered[idx].id;
        });
      }
    }

    // 3. Recalculate trip through TripService
    const allStops = [...completedStops, ...remainingStops];
    allStops.forEach((s, idx) => s.order = idx + 1);

    // Save stops and recalculate metrics
    const updatedTrip = await this.tripService.recalculateTrip(tripId, userId);
    return updatedTrip;
  }
}
