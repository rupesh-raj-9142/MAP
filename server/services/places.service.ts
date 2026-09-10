import { PlaceProvider, getPlaceProvider, NearbySearchParams } from '../integrations/places/index.js';
import { PlaceRepository } from '../repositories/place.repository.js';
import { PlaceModel } from '../../types/index.js';
import { getAIProvider } from '../integrations/ai/index.js';
import { logger } from '../utils/logger.js';

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

  /**
   * Use Gemini AI to discover famous and authentic places in any queried location.
   */
  async discoverPlacesWithAI(locationQuery: string, category?: string): Promise<PlaceModel[]> {
    try {
      const ai = getAIProvider();
      if (ai.discoverPlaces) {
        const aiPlaces = await ai.discoverPlaces(locationQuery, category);
        if (aiPlaces.length > 0) {
          for (const p of aiPlaces) {
            await this.repository.upsert(p);
          }
          return aiPlaces;
        }
      }
    } catch (err) {
      logger.error(`Failed AI place discovery for "${locationQuery}":`, err);
    }
    return [];
  }

  async searchPlaces(query: string, city?: string, limit = 20, forceAi = false): Promise<PlaceModel[]> {
    const trimmedQuery = query.trim();

    // 1. If explicit AI search requested, trigger AI discovery immediately
    if (forceAi && trimmedQuery.length > 1) {
      const aiPlaces = await this.discoverPlacesWithAI(trimmedQuery);
      if (aiPlaces.length > 0) {
        return aiPlaces.slice(0, limit);
      }
    }

    // 2. Query local repository / mock provider
    const existingPlaces = await this.provider.searchPlaces(trimmedQuery, city, limit);

    // 3. If zero or very few results found in database (e.g. searching a new city like "Agra", "Goa", "Kashmir", "Ayodhya"),
    // ask Gemini AI to discover famous places for this location!
    if (existingPlaces.length < 2 && trimmedQuery.length > 2) {
      logger.info(`Few or no local results for "${trimmedQuery}". Invoking Gemini AI to discover famous places...`);
      const aiPlaces = await this.discoverPlacesWithAI(trimmedQuery);
      if (aiPlaces.length > 0) {
        // Merge and return
        const combined = [...existingPlaces, ...aiPlaces];
        const unique = Array.from(new Map(combined.map(p => [p.id, p])).values());
        return unique.slice(0, limit);
      }
    }

    for (const place of existingPlaces) {
      await this.repository.upsert(place);
    }
    return existingPlaces;
  }
}
