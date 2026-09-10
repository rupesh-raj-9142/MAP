import { AIPlanOutput } from '../../../types/index.js';
import { AIPlanContext, AIProvider } from './aiProvider.interface.js';
import { AIPlanOutputSchema } from '../../validators/ai.validator.js';

export class MockAIProvider implements AIProvider {
  async generateTripPlan(context: AIPlanContext): Promise<AIPlanOutput> {
    const { request, candidatePlaces, targetStopsCount } = context;
    const city = request.location.city || 'Patna';

    // Score places by user interest match and rating
    const scored = candidatePlaces.map(place => {
      let score = place.rating * 10;
      if (request.interests.some(i => i.toLowerCase() === place.category.toLowerCase())) {
        score += 30;
      }
      return { place, score };
    }).sort((a, b) => b.score - a.score);

    // Pick candidate set limited to target count
    const selected = scored.slice(0, Math.max(1, Math.min(targetStopsCount, scored.length)));

    // Generate personalized reasons
    const mood = request.mood || 'balanced';
    const group = request.travelGroup || 'solo';

    const stops = selected.map((item, idx) => {
      const p = item.place;
      let reason = `Selected for ${p.category} significance.`;
      if (request.interests.includes(p.category)) {
        reason = `Directly matches your interest in ${p.category} with exceptional rating (${p.rating}★).`;
      } else if (idx === 0) {
        reason = `Ideal starting landmark for ${group} travelers seeking an authentic ${mood} atmosphere.`;
      } else if (idx === selected.length - 1) {
        reason = `Perfect final stop offering relaxing ambience and renowned regional street delicacies.`;
      }

      return {
        placeId: p.id,
        order: idx + 1,
        durationMinutes: p.recommendedDuration || 45,
        reason
      };
    });

    const interestLabel = request.interests.map(i => i.charAt(0).toUpperCase() + i.slice(1)).join(' & ');
    const hours = (request.availableTimeMinutes / 60).toFixed(1);

    const rawOutput: AIPlanOutput = {
      title: `${city} ${interestLabel} Yatra`,
      stops,
      reasoningSummary: `Orchestrated ${stops.length} stops over ~${hours}h with zero back-tracking corridor. Tailored for ${group} travelers with ${mood} pacing within ₹${request.budget} budget.`
    };

    // Validate with Zod
    return AIPlanOutputSchema.parse(rawOutput);
  }
}
