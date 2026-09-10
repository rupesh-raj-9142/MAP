import { GeocodingProvider, getGeocodingProvider } from '../integrations/maps/index.js';
import { GeocodingResult } from '../../types/index.js';

export class LocationService {
  private provider: GeocodingProvider;

  constructor(provider?: GeocodingProvider) {
    this.provider = provider || getGeocodingProvider();
  }

  async searchLocation(query: string): Promise<GeocodingResult[]> {
    return this.provider.searchLocation(query);
  }

  async reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null> {
    return this.provider.reverseGeocode(latitude, longitude);
  }
}
