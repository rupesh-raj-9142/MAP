import { PlaceModel } from '../../../types/index.js';

export interface NearbySearchParams {
  latitude: number;
  longitude: number;
  radiusMeters: number; // 5000, 10000, 20000
  category?: string;
  limit?: number;
  page?: number;
}

export interface PlaceProvider {
  getNearbyPlaces(params: NearbySearchParams): Promise<PlaceModel[]>;
  getPlaceDetails(placeId: string): Promise<PlaceModel | null>;
  searchPlaces(query: string, city?: string, limit?: number): Promise<PlaceModel[]>;
}
