import { RouteOptions, RouteProvider, getRouteProvider } from '../integrations/maps/index.js';
import { RouteResult } from '../../types/index.js';

export class RoutesService {
  private provider: RouteProvider;

  constructor(provider?: RouteProvider) {
    this.provider = provider || getRouteProvider();
  }

  async calculateRoute(options: RouteOptions): Promise<RouteResult> {
    return this.provider.calculateRoute(options);
  }
}
