import { AIPlanRequest, AIPlanOutput, PlaceModel } from '../../../types/index.js';

export interface AIPlanContext {
  request: AIPlanRequest;
  candidatePlaces: PlaceModel[];
  targetStopsCount: number;
}

export interface AIProvider {
  generateTripPlan(context: AIPlanContext): Promise<AIPlanOutput>;
}
