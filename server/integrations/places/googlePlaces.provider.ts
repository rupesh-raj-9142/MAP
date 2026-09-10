import { PlaceModel } from '../../../types/index.js';
import { NearbySearchParams, PlaceProvider } from './placeProvider.interface.js';
import { MockPlacesProvider } from './mockPlaces.provider.js';
import { logger } from '../../utils/logger.js';

export class GooglePlacesProvider implements PlaceProvider {
  private apiKey: string;
  private fallbackProvider = new MockPlacesProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_PLACES_API_KEY || '';
  }

  async getNearbyPlaces(params: NearbySearchParams): Promise<PlaceModel[]> {
    if (!this.apiKey) {
      return this.fallbackProvider.getNearbyPlaces(params);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${params.latitude},${params.longitude}&radius=${params.radiusMeters}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Places API error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        logger.warn(`Google Places returned status ${data.status}, falling back to mock provider`);
        return this.fallbackProvider.getNearbyPlaces(params);
      }

      if (!data.results || data.results.length === 0) {
        return [];
      }

      return data.results.slice(0, params.limit || 20).map((r: any) => this.normalizePlace(r));
    } catch (err) {
      logger.error('Failed to query Google Places Nearby:', err);
      return this.fallbackProvider.getNearbyPlaces(params);
    }
  }

  async getPlaceDetails(placeId: string): Promise<PlaceModel | null> {
    if (!this.apiKey) {
      return this.fallbackProvider.getPlaceDetails(placeId);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(placeId)}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Places Details API error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.result) {
        return this.fallbackProvider.getPlaceDetails(placeId);
      }

      return this.normalizePlace(data.result);
    } catch (err) {
      logger.error('Failed to query Google Place Details:', err);
      return this.fallbackProvider.getPlaceDetails(placeId);
    }
  }

  async searchPlaces(query: string, city?: string, limit = 20): Promise<PlaceModel[]> {
    if (!this.apiKey) {
      return this.fallbackProvider.searchPlaces(query, city, limit);
    }

    try {
      const searchQuery = city ? `${query} in ${city}` : query;
      const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(searchQuery)}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Places Text Search error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        return this.fallbackProvider.searchPlaces(query, city, limit);
      }

      return (data.results || []).slice(0, limit).map((r: any) => this.normalizePlace(r));
    } catch (err) {
      logger.error('Failed to query Google Places Search:', err);
      return this.fallbackProvider.searchPlaces(query, city, limit);
    }
  }

  private normalizePlace(raw: any): PlaceModel {
    const lat = raw.geometry?.location?.lat || 0;
    const lng = raw.geometry?.location?.lng || 0;
    const photoRef = raw.photos?.[0]?.photo_reference;
    const photoUrl = photoRef && this.apiKey
      ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&photoreference=${photoRef}&key=${this.apiKey}`
      : 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80';

    return {
      id: raw.place_id ? `g-${raw.place_id}` : `place-${Date.now()}`,
      externalId: raw.place_id || null,
      name: raw.name || 'Unnamed Place',
      description: raw.editorial_summary?.overview || raw.vicinity || 'Historic landmark and attraction',
      category: this.mapGoogleTypeToCategory(raw.types || []),
      latitude: lat,
      longitude: lng,
      address: raw.formatted_address || raw.vicinity || 'Address unavailable',
      rating: typeof raw.rating === 'number' ? raw.rating : 4.0,
      reviewCount: raw.user_ratings_total || 0,
      phoneNumber: raw.formatted_phone_number || null,
      website: raw.website || null,
      openingHours: raw.opening_hours?.weekday_text?.join('; ') || (raw.opening_hours?.open_now ? 'Open Now' : null),
      priceLevel: raw.price_level !== undefined ? '₹'.repeat(Math.max(1, raw.price_level)) : null,
      entryFee: 0,
      recommendedDuration: 60,
      photos: [photoUrl],
      source: 'GOOGLE_PLACES'
    };
  }

  private mapGoogleTypeToCategory(types: string[]): string {
    if (types.some(t => ['hindu_temple', 'mosque', 'church', 'synagogue', 'place_of_worship'].includes(t))) {
      return 'spiritual';
    }
    if (types.some(t => ['museum', 'art_gallery', 'cultural_center'].includes(t))) {
      return 'culture';
    }
    if (types.some(t => ['park', 'natural_feature', 'campground'].includes(t))) {
      return 'nature';
    }
    if (types.some(t => ['restaurant', 'cafe', 'food', 'bakery'].includes(t))) {
      return 'food';
    }
    return 'history';
  }
}
