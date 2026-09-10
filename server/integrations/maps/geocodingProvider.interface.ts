import { GeocodingResult } from '../../../types/index.js';

export interface GeocodingProvider {
  searchLocation(query: string): Promise<GeocodingResult[]>;
  reverseGeocode(latitude: number, longitude: number): Promise<GeocodingResult | null>;
}
