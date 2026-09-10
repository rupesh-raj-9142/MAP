import { PlaceProvider } from './placeProvider.interface.js';
import { GooglePlacesProvider } from './googlePlaces.provider.js';
import { MockPlacesProvider } from './mockPlaces.provider.js';

let placeProviderInstance: PlaceProvider | null = null;

export function getPlaceProvider(): PlaceProvider {
  if (!placeProviderInstance) {
    const useMock = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_PLACES_API_KEY;
    if (useMock) {
      placeProviderInstance = new MockPlacesProvider();
    } else {
      placeProviderInstance = new GooglePlacesProvider();
    }
  }
  return placeProviderInstance;
}

export * from './placeProvider.interface.js';
export * from './mockPlaces.provider.js';
export * from './googlePlaces.provider.js';
