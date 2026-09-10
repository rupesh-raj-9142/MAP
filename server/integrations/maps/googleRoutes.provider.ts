import { RouteCoordinate, RouteLeg, RouteResult } from '../../../types/index.js';
import { RouteOptions, RouteProvider } from './routeProvider.interface.js';
import { MockRoutesProvider } from './mockRoutes.provider.js';
import { logger } from '../../utils/logger.js';

export class GoogleRoutesProvider implements RouteProvider {
  private apiKey: string;
  private fallbackProvider = new MockRoutesProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  }

  async calculateRoute(options: RouteOptions): Promise<RouteResult> {
    if (!this.apiKey) {
      return this.fallbackProvider.calculateRoute(options);
    }

    try {
      const mode = (options.travelMode || 'DRIVE').toLowerCase();
      const originStr = `${options.origin.latitude},${options.origin.longitude}`;
      const destStr = `${options.destination.latitude},${options.destination.longitude}`;

      let url = `https://maps.googleapis.com/maps/api/directions/json?origin=${originStr}&destination=${destStr}&mode=${mode}&key=${this.apiKey}`;
      if (options.waypoints && options.waypoints.length > 0) {
        const waypointsStr = options.waypoints.map(w => `${w.latitude},${w.longitude}`).join('|');
        url += `&waypoints=${encodeURIComponent(waypointsStr)}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Directions API error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.routes || data.routes.length === 0) {
        logger.warn(`Google Directions returned status ${data.status}, falling back to mock provider`);
        return this.fallbackProvider.calculateRoute(options);
      }

      const route = data.routes[0];
      let totalDistanceMeters = 0;
      let totalDurationMinutes = 0;
      const legs: RouteLeg[] = [];

      for (const leg of route.legs) {
        const distMeters = leg.distance?.value || 0;
        const durSeconds = leg.duration?.value || 0;
        const durMinutes = Math.max(1, Math.round(durSeconds / 60));

        totalDistanceMeters += distMeters;
        totalDurationMinutes += durMinutes;

        legs.push({
          origin: { latitude: leg.start_location.lat, longitude: leg.start_location.lng },
          destination: { latitude: leg.end_location.lat, longitude: leg.end_location.lng },
          distanceMeters: distMeters,
          distanceKm: parseFloat((distMeters / 1000).toFixed(2)),
          durationMinutes: durMinutes,
          mode: options.travelMode || 'DRIVE',
          modeLabel: `${durMinutes}m via ${(options.travelMode || 'Drive').toLowerCase()}`,
          costEstimate: 40
        });
      }

      return {
        origin: options.origin,
        destination: options.destination,
        totalDistanceMeters,
        totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(1)),
        totalDurationMinutes,
        travelMode: options.travelMode || 'DRIVE',
        legs,
        polyline: route.overview_polyline?.points
      };
    } catch (err) {
      logger.error('Failed to compute Google Route:', err);
      return this.fallbackProvider.calculateRoute(options);
    }
  }
}
