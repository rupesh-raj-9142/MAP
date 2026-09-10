import { GeocodingResult } from '../../../types/index.js';
import { GeocodingProvider } from './geocodingProvider.interface.js';
import { MockGeocodingProvider } from './mockGeocoding.provider.js';
import { logger } from '../../utils/logger.js';

export class GoogleGeocodingProvider implements GeocodingProvider {
  private apiKey: string;
  private fallback = new MockGeocodingProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_MAPS_API_KEY || '';
  }

  async searchLocation(query: string): Promise<GeocodingResult[]> {
    if (!this.apiKey) {
      return this.fallback.searchLocation(query);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Geocode error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return this.fallback.searchLocation(query);
      }

      return data.results.map((r: any) => this.mapResult(r));
    } catch (err) {
      logger.error('Failed to geocode with Google:', err);
      return this.fallback.searchLocation(query);
    }
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    if (!this.apiKey) {
      return this.fallback.reverseGeocode(latitude, longitude);
    }

    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${this.apiKey}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Google Reverse Geocode error: ${response.statusText}`);
      }
      const data: any = await response.json();

      if (data.status !== 'OK' || !data.results || data.results.length === 0) {
        return this.fallback.reverseGeocode(latitude, longitude);
      }

      return this.mapResult(data.results[0]);
    } catch (err) {
      logger.error('Failed to reverse geocode with Google:', err);
      return this.fallback.reverseGeocode(latitude, longitude);
    }
  }

  private mapResult(raw: any): GeocodingResult {
    let city = 'City';
    let state: string | undefined;
    let country: string | undefined;

    for (const comp of raw.address_components || []) {
      if (comp.types.includes('locality')) city = comp.long_name;
      if (comp.types.includes('administrative_area_level_1')) state = comp.long_name;
      if (comp.types.includes('country')) country = comp.long_name;
    }

    return {
      latitude: raw.geometry?.location?.lat || 0,
      longitude: raw.geometry?.location?.lng || 0,
      formattedAddress: raw.formatted_address || '',
      city,
      state,
      country
    };
  }
}
