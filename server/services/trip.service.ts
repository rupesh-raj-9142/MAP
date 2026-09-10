import { TripRepository } from '../repositories/trip.repository.js';
import { PlaceRepository } from '../repositories/place.repository.js';
import { RoutesService } from './routes.service.js';
import { BudgetService } from './budget.service.js';
import { TripModel, TripStopModel, ItineraryModel, PlaceModel, StopStatus, TripStatus } from '../../types/index.js';

export class TripService {
  private tripRepo: TripRepository;
  private placeRepo: PlaceRepository;
  private routesService: RoutesService;
  private budgetService: BudgetService;

  constructor(
    tripRepo?: TripRepository,
    placeRepo?: PlaceRepository,
    routesService?: RoutesService,
    budgetService?: BudgetService
  ) {
    this.tripRepo = tripRepo || new TripRepository();
    this.placeRepo = placeRepo || new PlaceRepository();
    this.routesService = routesService || new RoutesService();
    this.budgetService = budgetService || new BudgetService();
  }

  async createTrip(userId: string, data: {
    title: string;
    locationName: string;
    latitude: number;
    longitude: number;
    durationMinutes: number;
    budget: number;
    travelMood?: string;
    travelGroup?: string;
    transportPreference?: string;
    stops: Array<{
      placeId: string;
      order: number;
      durationMinutes: number;
      notes?: string;
    }>;
  }): Promise<TripModel> {
    const tripId = 'trip-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7);

    // Fetch places
    const places = [];
    for (const s of data.stops) {
      const p = await this.placeRepo.findById(s.placeId);
      if (p) places.push(p);
    }

    // Calculate initial route between stops
    const stopsModels: TripStopModel[] = [];
    let currentHour = 9;
    let currentMinute = 30;

    for (let i = 0; i < places.length; i++) {
      const p = places[i];
      const stopInput = data.stops.find(s => s.placeId === p.id) || { durationMinutes: 60, notes: '' };

      const hStr = currentHour > 12 ? (currentHour - 12) : currentHour;
      const ampm = currentHour >= 12 ? 'PM' : 'AM';
      const mStr = currentMinute < 10 ? '0' + currentMinute : currentMinute;
      const startTime = `${hStr}:${mStr} ${ampm}`;

      currentMinute += stopInput.durationMinutes;
      while (currentMinute >= 60) {
        currentMinute -= 60;
        currentHour += 1;
      }

      let travelTimeMinutes = 0;
      let travelDistanceMeters = 0;
      let transitNext = "Tour Concludes";

      if (i < places.length - 1) {
        const nextP = places[i + 1];
        const route = await this.routesService.calculateRoute({
          origin: { latitude: p.latitude, longitude: p.longitude },
          destination: { latitude: nextP.latitude, longitude: nextP.longitude },
          travelMode: (data.transportPreference?.toUpperCase() === 'WALKING' ? 'WALK' : 'DRIVE') as any
        });

        travelTimeMinutes = route.totalDurationMinutes;
        travelDistanceMeters = route.totalDistanceMeters;
        transitNext = `${travelTimeMinutes}m via Transit (${route.totalDistanceKm} km)`;

        currentMinute += travelTimeMinutes;
        while (currentMinute >= 60) {
          currentMinute -= 60;
          currentHour += 1;
        }
      }

      stopsModels.push({
        id: 'stop-' + Date.now() + '-' + i,
        tripId,
        placeId: p.id,
        order: i + 1,
        startTime,
        durationMinutes: stopInput.durationMinutes,
        travelTimeMinutes,
        travelDistanceMeters,
        estimatedCost: p.entryFee || 0,
        notes: stopInput.notes || null,
        status: 'PENDING',
        place: p,
        transitNext
      });
    }

    // Recalculate itinerary totals
    const itinerary = await this.recalculateMetrics(tripId, data.budget, stopsModels, data.travelGroup || 'solo');

    const newTrip: TripModel = {
      id: tripId,
      userId,
      title: data.title,
      locationName: data.locationName,
      latitude: data.latitude,
      longitude: data.longitude,
      durationMinutes: itinerary.totalDurationMinutes,
      budget: data.budget,
      travelMood: data.travelMood || null,
      travelGroup: data.travelGroup || null,
      transportPreference: data.transportPreference || null,
      status: 'PLANNED',
      stops: stopsModels,
      itinerary,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return this.tripRepo.create(newTrip);
  }

  async getTripsByUser(userId: string): Promise<TripModel[]> {
    return this.tripRepo.findByUserId(userId);
  }

  async getTripById(tripId: string, userId: string): Promise<TripModel> {
    const trip = await this.tripRepo.findById(tripId, userId);
    if (!trip) {
      throw new Error('NOT_FOUND: Trip not found or access denied');
    }
    return trip;
  }

  async updateTrip(tripId: string, userId: string, data: Partial<TripModel>): Promise<TripModel> {
    const updated = await this.tripRepo.update(tripId, userId, data);
    if (!updated) {
      throw new Error('NOT_FOUND: Trip not found or access denied');
    }
    return updated;
  }

  async deleteTrip(tripId: string, userId: string): Promise<boolean> {
    const deleted = await this.tripRepo.delete(tripId, userId);
    if (!deleted) {
      throw new Error('NOT_FOUND: Trip not found or access denied');
    }
    return true;
  }

  async addStop(tripId: string, userId: string, placeId: string, durationMinutes = 45): Promise<TripModel> {
    const trip = await this.getTripById(tripId, userId);
    const place = await this.placeRepo.findById(placeId);
    if (!place) {
      throw new Error('NOT_FOUND: Place not found');
    }

    const order = trip.stops.length + 1;
    const newStop: TripStopModel = {
      id: 'stop-' + Date.now(),
      tripId,
      placeId,
      order,
      durationMinutes,
      travelTimeMinutes: 15,
      travelDistanceMeters: 2500,
      estimatedCost: place.entryFee,
      status: 'PENDING',
      place
    };

    trip.stops.push(newStop);
    const itinerary = await this.recalculateMetrics(tripId, trip.budget, trip.stops, trip.travelGroup || 'solo');
    const updated = await this.tripRepo.updateStopsAndItinerary(tripId, userId, trip.stops, itinerary);
    return updated!;
  }

  async updateStop(
    tripId: string,
    userId: string,
    stopId: string,
    data: { status?: StopStatus; durationMinutes?: number; notes?: string }
  ): Promise<TripModel> {
    const trip = await this.getTripById(tripId, userId);
    const stop = trip.stops.find(s => s.id === stopId || s.placeId === stopId);
    if (!stop) {
      throw new Error('NOT_FOUND: Trip stop not found');
    }

    if (data.status) stop.status = data.status;
    if (data.durationMinutes) stop.durationMinutes = data.durationMinutes;
    if (data.notes !== undefined) stop.notes = data.notes;

    const itinerary = await this.recalculateMetrics(tripId, trip.budget, trip.stops, trip.travelGroup || 'solo');
    const updated = await this.tripRepo.updateStopsAndItinerary(tripId, userId, trip.stops, itinerary);
    return updated!;
  }

  async removeStop(tripId: string, userId: string, stopId: string): Promise<TripModel> {
    const trip = await this.getTripById(tripId, userId);
    const remaining = trip.stops.filter(s => s.id !== stopId && s.placeId !== stopId);
    if (remaining.length === 0) {
      throw new Error('INVALID_OPERATION: A trip must have at least one stop');
    }

    // Re-index order
    remaining.forEach((s, idx) => s.order = idx + 1);

    const itinerary = await this.recalculateMetrics(tripId, trip.budget, remaining, trip.travelGroup || 'solo');
    const updated = await this.tripRepo.updateStopsAndItinerary(tripId, userId, remaining, itinerary);
    return updated!;
  }

  async replaceStop(tripId: string, userId: string, stopId: string, newPlaceId: string): Promise<TripModel> {
    const trip = await this.getTripById(tripId, userId);
    const stopIndex = trip.stops.findIndex(s => s.id === stopId || s.placeId === stopId);
    if (stopIndex === -1) {
      throw new Error('NOT_FOUND: Target stop not found');
    }

    const newPlace = await this.placeRepo.findById(newPlaceId);
    if (!newPlace) {
      throw new Error('NOT_FOUND: Replacement place not found');
    }

    trip.stops[stopIndex].placeId = newPlace.id;
    trip.stops[stopIndex].place = newPlace;
    trip.stops[stopIndex].durationMinutes = newPlace.recommendedDuration || 45;
    trip.stops[stopIndex].status = 'REPLACED';

    const itinerary = await this.recalculateMetrics(tripId, trip.budget, trip.stops, trip.travelGroup || 'solo');
    const updated = await this.tripRepo.updateStopsAndItinerary(tripId, userId, trip.stops, itinerary);
    return updated!;
  }

  async recalculateTrip(tripId: string, userId: string): Promise<TripModel> {
    const trip = await this.getTripById(tripId, userId);
    const itinerary = await this.recalculateMetrics(tripId, trip.budget, trip.stops, trip.travelGroup || 'solo');
    const updated = await this.tripRepo.updateStopsAndItinerary(tripId, userId, trip.stops, itinerary);
    return updated!;
  }

  private async recalculateMetrics(
    tripId: string,
    budget: number,
    stops: TripStopModel[],
    travelGroup: string
  ): Promise<ItineraryModel> {
    let totalDurationMinutes = 0;
    let totalDistanceMeters = 0;
    const places: PlaceModel[] = [];

    for (let i = 0; i < stops.length; i++) {
      const stop = stops[i];
      let p = stop.place;
      if (!p) {
        p = (await this.placeRepo.findById(stop.placeId)) || undefined;
      }
      if (p) places.push(p);

      totalDurationMinutes += stop.durationMinutes;

      if (i < stops.length - 1 && p) {
        const nextStop = stops[i + 1];
        let nextP = nextStop.place || (await this.placeRepo.findById(nextStop.placeId));
        if (nextP) {
          const legRoute = await this.routesService.calculateRoute({
            origin: { latitude: p.latitude, longitude: p.longitude },
            destination: { latitude: nextP.latitude, longitude: nextP.longitude }
          });
          stop.travelDistanceMeters = legRoute.totalDistanceMeters;
          stop.travelTimeMinutes = legRoute.totalDurationMinutes;
          stop.transitNext = `${legRoute.totalDurationMinutes}m via Transit (${legRoute.totalDistanceKm} km)`;

          totalDistanceMeters += legRoute.totalDistanceMeters;
          totalDurationMinutes += legRoute.totalDurationMinutes;
        }
      } else {
        stop.transitNext = "Tour Concludes";
      }
    }

    const budgetCalc = this.budgetService.calculateTripBudget(budget, places, [], travelGroup);

    return {
      id: 'itin-' + Date.now(),
      tripId,
      totalDurationMinutes,
      totalDistanceMeters,
      totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(1)),
      estimatedTotalCost: budgetCalc.estimatedCost,
      reasoningSummary: `Recalculated itinerary with ${stops.length} stops over ${(totalDurationMinutes / 60).toFixed(1)}h. Zero-backtrack corridor.`
    };
  }
}
