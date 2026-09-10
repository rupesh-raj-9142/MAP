import { RouteProvider } from './routeProvider.interface.js';
import { GoogleRoutesProvider } from './googleRoutes.provider.js';
import { MockRoutesProvider } from './mockRoutes.provider.js';
import { GeocodingProvider } from './geocodingProvider.interface.js';
import { GoogleGeocodingProvider } from './googleGeocoding.provider.js';
import { MockGeocodingProvider } from './mockGeocoding.provider.js';

let routeProviderInstance: RouteProvider | null = null;
let geocodingProviderInstance: GeocodingProvider | null = null;

export function getRouteProvider(): RouteProvider {
  if (!routeProviderInstance) {
    const useMock = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_MAPS_API_KEY;
    if (useMock) {
      routeProviderInstance = new MockRoutesProvider();
    } else {
      routeProviderInstance = new GoogleRoutesProvider();
    }
  }
  return routeProviderInstance;
}

export function getGeocodingProvider(): GeocodingProvider {
  if (!geocodingProviderInstance) {
    const useMock = process.env.USE_MOCK_DATA === 'true' || !process.env.GOOGLE_MAPS_API_KEY;
    if (useMock) {
      geocodingProviderInstance = new MockGeocodingProvider();
    } else {
      geocodingProviderInstance = new GoogleGeocodingProvider();
    }
  }
  return geocodingProviderInstance;
}

export * from './routeProvider.interface.js';
export * from './geocodingProvider.interface.js';
export * from './mockRoutes.provider.js';
export * from './googleRoutes.provider.js';
export * from './mockGeocoding.provider.js';
export * from './googleGeocoding.provider.js';
