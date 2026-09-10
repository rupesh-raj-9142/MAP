import { AIPlanOutput } from '../../../types/index.js';
import { AIPlanContext, AIProvider } from './aiProvider.interface.js';
import { MockAIProvider } from './mockAi.provider.js';
import { AIPlanOutputSchema } from '../../validators/ai.validator.js';
import { logger } from '../../utils/logger.js';

export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private fallback = new MockAIProvider();

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || '';
  }

  async generateTripPlan(context: AIPlanContext): Promise<AIPlanOutput> {
    if (!this.apiKey) {
      return this.fallback.generateTripPlan(context);
    }

    try {
      const { request, candidatePlaces, targetStopsCount } = context;

      const factualPlacesSummary = candidatePlaces.map(p => ({
        placeId: p.id,
        name: p.name,
        category: p.category,
        rating: p.rating,
        entryFee: p.entryFee,
        recommendedDuration: p.recommendedDuration,
        address: p.address
      }));

      const systemPrompt = `You are YATRA AI, an intelligent trip orchestrator for authentic Indian travel exploration.
CRITICAL RULES:
1. You MUST ONLY pick places from the provided factual candidates array. NEVER invent new places or hallucinate place IDs.
2. Select approximately ${targetStopsCount} places that best fit the traveler's interests (${request.interests.join(', ')}), available time (${request.availableTimeMinutes} mins), budget (₹${request.budget}), mood (${request.mood || 'balanced'}), and group (${request.travelGroup || 'solo'}).
3. Order them logically to create a smooth zero-backtrack itinerary.
4. Output STRICT JSON only. Do not include markdown codeblocks or extra text.

JSON Schema:
{
  "title": "String",
  "stops": [
    {
      "placeId": "exact string from candidate placeId",
      "order": 1,
      "durationMinutes": 45,
      "reason": "Clear explanation connecting this place to traveler preferences"
    }
  ],
  "reasoningSummary": "Brief overview of why this route is optimal"
}`;

      const userPrompt = `Factual candidate places: ${JSON.stringify(factualPlacesSummary)}
Traveler request: ${JSON.stringify(request)}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.2
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API returned status ${response.status}: ${response.statusText}`);
      }

      const data: any = await response.json();
      const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!rawText) {
        throw new Error('Empty response from Gemini');
      }

      const parsedJson = JSON.parse(rawText);
      const validated = AIPlanOutputSchema.parse(parsedJson);

      // Verify that every placeId exists in candidatePlaces
      const validStops = validated.stops.filter(s => candidatePlaces.some(c => c.id === s.placeId));
      if (validStops.length === 0) {
        throw new Error('AI generated stops with invalid or non-candidate place IDs');
      }
      validated.stops = validStops;

      return validated;
    } catch (err) {
      logger.error('Gemini AI Provider failed or output invalid, falling back to MockAIProvider:', err);
      return this.fallback.generateTripPlan(context);
    }
  }
}
