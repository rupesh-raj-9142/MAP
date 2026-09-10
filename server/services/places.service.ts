import { PlaceProvider, getPlaceProvider, NearbySearchParams } from '../integrations/places/index.js';
import { PlaceRepository } from '../repositories/place.repository.js';
import { PlaceModel } from '../../types/index.js';

export class PlacesService {
  private provider: PlaceProvider;
  private repository: PlaceRepository;

  constructor(provider?: PlaceProvider, repository?: PlaceRepository) {
    this.provider = provider || getPlaceProvider();
    this.repository = repository || new PlaceRepository();
  }

  async getNearbyPlaces(params: NearbySearchParams): Promise<PlaceModel[]> {
    // Fetch from provider
    const places = await this.provider.getNearbyPlaces(params);

    // Save/cache into repository for offline fast lookup
    for (const place of places) {
      await this.repository.upsert(place);
    }

    return places;
  }

  async getPlaceDetails(placeId: string): Promise<PlaceModel | null> {
    // Check repository first
    let place = await this.repository.findById(placeId);
    if (place) return place;

    // Check external provider
    place = await this.provider.getPlaceDetails(placeId);
    if (place) {
      await this.repository.upsert(place);
    }

    return place;
  }

  async searchPlaces(query: string, city?: string, limit = 20): Promise<PlaceModel[]> {
    const places = await this.provider.searchPlaces(query, city, limit);
    for (const place of places) {
      await this.repository.upsert(place);
    }
    return places;
  }
}
