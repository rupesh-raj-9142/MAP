import { PlaceModel } from '../../../types/index.js';
import { NearbySearchParams, PlaceProvider } from './placeProvider.interface.js';
import { SEED_PLACES } from './seedData.js';

export class MockPlacesProvider implements PlaceProvider {
  private places: PlaceModel[] = [...SEED_PLACES];

  async getNearbyPlaces(params: NearbySearchParams): Promise<PlaceModel[]> {
    const { latitude, longitude, radiusMeters, category, limit = 20 } = params;

    // Filter by category if specified
    let filtered = this.places;
    if (category && category !== 'all') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    // Calculate distance and filter within radius
    const withDistance = filtered.map(place => {
      const distMeters = this.calculateDistanceMeters(
        latitude,
        longitude,
        place.latitude,
        place.longitude
      );
      return { place, distMeters };
    });

    // If within radius, return them sorted by distance.
    // If none are within radius (e.g. user selected far away coord), return the closest matching places
    const withinRadius = withDistance.filter(item => item.distMeters <= radiusMeters);
    const sorted = (withinRadius.length > 0 ? withinRadius : withDistance)
      .sort((a, b) => a.distMeters - b.distMeters)
      .slice(0, limit)
      .map(item => item.place);

    return sorted;
  }

  async getPlaceDetails(placeId: string): Promise<PlaceModel | null> {
    const found = this.places.find(p => p.id === placeId || p.externalId === placeId);
    return found || null;
  }

  async searchPlaces(query: string, city?: string, limit = 20): Promise<PlaceModel[]> {
    const q = query.toLowerCase().trim();
    let matches = this.places.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.address.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q)
    );

    if (city) {
      const c = city.toLowerCase();
      matches = matches.filter(p => p.address.toLowerCase().includes(c));
    }

    return matches.slice(0, limit);
  }

  private calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
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
