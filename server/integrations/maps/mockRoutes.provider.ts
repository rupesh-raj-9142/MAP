import { RouteCoordinate, RouteLeg, RouteResult } from '../../../types/index.js';
import { RouteOptions, RouteProvider } from './routeProvider.interface.js';

export class MockRoutesProvider implements RouteProvider {
  async calculateRoute(options: RouteOptions): Promise<RouteResult> {
    const { origin, destination, waypoints = [], travelMode = 'DRIVE' } = options;

    const points: RouteCoordinate[] = [origin, ...waypoints, destination];
    const legs: RouteLeg[] = [];
    let totalDistanceMeters = 0;
    let totalDurationMinutes = 0;

    for (let i = 0; i < points.length - 1; i++) {
      const from = points[i];
      const to = points[i + 1];
      const distMeters = Math.round(this.calculateDistanceMeters(from.latitude, from.longitude, to.latitude, to.longitude));
      const distKm = parseFloat((distMeters / 1000).toFixed(2));

      // Calculate realistic speed & time based on mode
      let speedKmH = 25; // DRIVE urban
      let modeLabel = 'E-Rickshaw / Auto';
      let cost = 40;

      if (travelMode === 'WALK') {
        speedKmH = 4.5;
        modeLabel = 'Scenic Walk';
        cost = 0;
      } else if (travelMode === 'BICYCLE') {
        speedKmH = 12;
        modeLabel = 'Bicycle';
        cost = 20;
      } else if (travelMode === 'TRANSIT') {
        speedKmH = 20;
        modeLabel = 'Public Transit / Metro';
        cost = 30;
      } else {
        // DRIVE
        if (distKm < 1.0) {
          modeLabel = 'Short Walk / Auto';
          cost = 30;
        } else if (distKm > 5.0) {
          modeLabel = 'Express AC Cab';
          cost = 150;
        }
      }

      const durationMinutes = Math.max(3, Math.round((distKm / speedKmH) * 60) + 2); // +2 min traffic/signal buffer

      totalDistanceMeters += distMeters;
      totalDurationMinutes += durationMinutes;

      legs.push({
        origin: from,
        destination: to,
        distanceMeters: distMeters,
        distanceKm: distKm,
        durationMinutes,
        mode: travelMode,
        modeLabel,
        costEstimate: cost
      });
    }

    return {
      origin,
      destination,
      totalDistanceMeters,
      totalDistanceKm: parseFloat((totalDistanceMeters / 1000).toFixed(1)),
      totalDurationMinutes,
      travelMode,
      legs
    };
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
