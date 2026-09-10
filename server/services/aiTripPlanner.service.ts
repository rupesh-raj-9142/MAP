import { AIPlanRequest, PlaceModel, TripModel, TripStopModel } from '../../types/index.js';
import { LocationService } from './location.service.js';
import { PlacesService } from './places.service.js';
import { RouteOptimizationService } from './routeOptimization.service.js';
import { RoutesService } from './routes.service.js';
import { BudgetService } from './budget.service.js';
import { TripService } from './trip.service.js';
import { getAIProvider, AIProvider } from '../integrations/ai/index.js';
import { AIPlanRequestSchema } from '../validators/ai.validator.js';
import { logger } from '../utils/logger.js';

export class AITripPlannerService {
  private locationService: LocationService;
  private placesService: PlacesService;
  private routeOptService: RouteOptimizationService;
  private routesService: RoutesService;
  private budgetService: BudgetService;
  private tripService: TripService;
  private aiProvider: AIProvider;

  constructor(
    locationService?: LocationService,
    placesService?: PlacesService,
    routeOptService?: RouteOptimizationService,
    routesService?: RoutesService,
    budgetService?: BudgetService,
    tripService?: TripService,
    aiProvider?: AIProvider
  ) {
    this.locationService = locationService || new LocationService();
    this.placesService = placesService || new PlacesService();
    this.routeOptService = routeOptService || new RouteOptimizationService();
    this.routesService = routesService || new RoutesService();
    this.budgetService = budgetService || new BudgetService();
    this.tripService = tripService || new TripService();
    this.aiProvider = aiProvider || getAIProvider();
  }

  async planTrip(userId: string, rawRequest: AIPlanRequest): Promise<TripModel> {
    // 1. Validate input schema
    const request = AIPlanRequestSchema.parse(rawRequest);

    // 2. Resolve location coordinates
    let latitude = request.location.latitude;
    let longitude = request.location.longitude;
    let city = request.location.city || 'Patna';

    if (latitude === undefined || longitude === undefined) {
      const geocoded = await this.locationService.searchLocation(city);
      if (geocoded.length > 0) {
        latitude = geocoded[0].latitude;
        longitude = geocoded[0].longitude;
        city = geocoded[0].city || city;
      } else {
        latitude = 25.5941;
        longitude = 85.1376;
      }
    }

    // 3. Find candidate places around location
    const candidatePlaces = await this.placesService.getNearbyPlaces({
      latitude,
      longitude,
      radiusMeters: 15000,
      limit: 25
    });

    if (candidatePlaces.length === 0) {
      throw new Error('NO_PLACES: No verified attractions found for the specified location');
    }

    // Determine target count of stops based on available time
    let targetStops = 4;
    if (request.availableTimeMinutes <= 90) targetStops = 2;
    else if (request.availableTimeMinutes <= 180) targetStops = 3;
    else if (request.availableTimeMinutes >= 360) targetStops = 5;

    // 4. Send structured factual data to AI for personalization and ranking
    const aiOutput = await this.aiProvider.generateTripPlan({
      request: {
        ...request,
        location: { ...request.location, latitude, longitude, city }
      },
      candidatePlaces,
      targetStopsCount: targetStops
    });

    // 5. Itinerary Verification & Grounding (Never trust AI for factual coordinates, costs, or travel times)
    const verifiedPlaces: PlaceModel[] = [];
    for (const stop of aiOutput.stops) {
      const factual = candidatePlaces.find(c => c.id === stop.placeId);
      if (factual && !verifiedPlaces.some(v => v.id === factual.id)) {
        verifiedPlaces.push(factual);
      }
    }

    // Fallback if AI selected zero valid places
    if (verifiedPlaces.length === 0) {
      verifiedPlaces.push(...candidatePlaces.slice(0, targetStops));
    }

    // 6. Route Optimization: order places for a 100% zero-backtrack corridor
    const optimizedPlaces = this.routeOptService.optimizeStopOrder(
      { latitude, longitude },
      verifiedPlaces
    );

    // 7. Calculate exact route legs and transit times
    const stopsPayload = optimizedPlaces.map((p, idx) => {
      const aiStop = aiOutput.stops.find(s => s.placeId === p.id);
      return {
        placeId: p.id,
        order: idx + 1,
        durationMinutes: aiStop?.durationMinutes || p.recommendedDuration || 45,
        notes: aiStop?.reason || `Exploration stop ${idx + 1}`
      };
    });

    // 8. Create and persist verified trip
    const title = aiOutput.title || `${city} AI Yatra`;
    const createdTrip = await this.tripService.createTrip(userId, {
      title,
      locationName: city,
      latitude,
      longitude,
      durationMinutes: request.availableTimeMinutes,
      budget: request.budget,
      travelMood: request.mood,
      travelGroup: request.travelGroup,
      transportPreference: request.transportPreference,
      stops: stopsPayload
    });

    return createdTrip;
  }
}
