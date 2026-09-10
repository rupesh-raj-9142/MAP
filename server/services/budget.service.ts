import { PlaceModel, RouteLeg } from '../../types/index.js';

export interface BudgetCalculationResult {
  budget: number;
  entryFeesTotal: number;
  transitCostTotal: number;
  foodAllowance: number;
  estimatedCost: number;
  remaining: number;
  isWithinBudget: boolean;
}

export class BudgetService {
  calculateTripBudget(
    budget: number,
    places: PlaceModel[],
    routeLegs: RouteLeg[] = [],
    travelGroup = 'solo'
  ): BudgetCalculationResult {
    let entryFeesTotal = 0;
    for (const place of places) {
      entryFeesTotal += (place.entryFee || 0);
    }

    let transitCostTotal = 0;
    for (const leg of routeLegs) {
      transitCostTotal += (leg.costEstimate || 0);
    }

    // Food allowance based on stops and travel group
    let foodMultiplier = 1;
    if (travelGroup === 'friends' || travelGroup === 'family') foodMultiplier = 1.5;
    const foodAllowance = places.length > 3 ? Math.round(250 * foodMultiplier) : Math.round(120 * foodMultiplier);

    const estimatedCost = entryFeesTotal + transitCostTotal + foodAllowance;
    const remaining = Math.max(0, budget - estimatedCost);
    const isWithinBudget = estimatedCost <= budget;

    return {
      budget,
      entryFeesTotal,
      transitCostTotal,
      foodAllowance,
      estimatedCost,
      remaining,
      isWithinBudget
    };
  }
}
