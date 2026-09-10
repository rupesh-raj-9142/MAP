import { PlaceModel, RouteCoordinate } from '../../types/index.js';

export class RouteOptimizationService {
  /**
   * Order candidate places to produce a zero-backtrack corridor
   */
  optimizeStopOrder(
    origin: RouteCoordinate,
    places: PlaceModel[]
  ): PlaceModel[] {
    if (places.length <= 1) return [...places];

    const remaining = [...places];
    const ordered: PlaceModel[] = [];

    // Start with the place closest to the starting origin
    let currentCoord = origin;

    while (remaining.length > 0) {
      let nearestIndex = 0;
      let minDistance = Infinity;

      for (let i = 0; i < remaining.length; i++) {
        const candidate = remaining[i];
        const dist = this.haversineKm(
          currentCoord.latitude,
          currentCoord.longitude,
          candidate.latitude,
          candidate.longitude
        );

        if (dist < minDistance) {
          minDistance = dist;
          nearestIndex = i;
        }
      }

      const nextPlace = remaining.splice(nearestIndex, 1)[0];
      ordered.push(nextPlace);
      currentCoord = { latitude: nextPlace.latitude, longitude: nextPlace.longitude };
    }

    return ordered;
  }

  haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
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
