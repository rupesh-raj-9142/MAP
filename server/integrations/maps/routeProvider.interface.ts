import { RouteCoordinate, RouteResult } from '../../../types/index.js';

export interface RouteOptions {
  origin: RouteCoordinate;
  destination: RouteCoordinate;
  waypoints?: RouteCoordinate[];
  travelMode?: 'WALK' | 'DRIVE' | 'BICYCLE' | 'TRANSIT';
}

export interface RouteProvider {
  calculateRoute(options: RouteOptions): Promise<RouteResult>;
}
