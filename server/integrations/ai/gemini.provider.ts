import { AIPlanOutput, PlaceModel } from '../../../types/index.js';
import { AIPlanContext, AIProvider } from './aiProvider.interface.js';
import { MockAIProvider } from './mockAi.provider.js';
import { AIPlanOutputSchema } from '../../validators/ai.validator.js';
import { logger } from '../../utils/logger.js';

const CATEGORY_PHOTOS: Record<string, string[]> = {
  history: [
    'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1587474260584-136574528ed5?auto=format&fit=crop&w=800&q=80'
  ],
  culture: [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1608958435020-e8a7109ba809?auto=format&fit=crop&w=800&q=80'
  ],
  nature: [
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=800&q=80'
  ],
  food: [
    'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1565557623262-b51c2513a641?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?auto=format&fit=crop&w=800&q=80'
  ],
  spiritual: [
    'https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1599839575945-a9e5af0c3fa5?auto=format&fit=crop&w=800&q=80'
  ],
  adventure: [
    'https://images.unsplash.com/photo-1533130061792-64b345e4a833?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=800&q=80'
  ],
  shopping: [
    'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1555529669-e69e7aa0ba9a?auto=format&fit=crop&w=800&q=80'
  ]
};

export class GeminiAIProvider implements AIProvider {
  private apiKey: string;
  private model: string;
  private fallback = new MockAIProvider();

  constructor(apiKey?: string, model?: string) {
    this.apiKey = apiKey || process.env.AI_API_KEY || '';
    this.model = model || process.env.GEMINI_MODEL || 'gemini-3.6-flash';
  }

  /**
   * Discover famous and authentic places in any queried location using Google Gemini.
   */
  async discoverPlaces(locationQuery: string, category?: string): Promise<PlaceModel[]> {
    if (!this.apiKey) {
      logger.warn('No AI_API_KEY provided for discoverPlaces; returning fallback.');
      return [];
    }

    try {
      const prompt = `You are YATRA AI, India's premier travel discovery engine.
A traveler is exploring: "${locationQuery}"${category && category !== 'all' ? ` with focus on "${category}"` : ''}.

Return a JSON array of 5 to 8 famous, authentic, and must-visit landmarks, monuments, temples, scenic views, or cultural spots in or around "${locationQuery}".
For each place, provide:
- id: kebab-case string unique to this place (e.g. "agra-taj-mahal")
- name: Official or well-known name
- category: one of ["history", "culture", "nature", "food", "spiritual", "adventure", "shopping"]
- description: 2-3 engaging, descriptive sentences highlighting why it is famous and worth visiting
- address: realistic street or area address in ${locationQuery}
- latitude: accurate float latitude of the place
- longitude: accurate float longitude of the place
- rating: realistic float rating between 4.2 and 4.9
- reviewCount: realistic integer count (e.g. 500 to 25000)
- entryFee: approximate entry fee in INR (0 if free)
- recommendedDuration: recommended visit duration in minutes (e.g. 45, 60, 90, 120)
- openingHours: typical visiting hours (e.g. "06:00 AM - 06:00 PM")
- highlights: array of 2-3 key tags/highlights (e.g. ["UNESCO Heritage", "Panoramic Views"])
- localFoodTip: a famous local delicacy or eatery nearby
- crowdToday: one of ["Low Crowd", "Moderate Flow", "High Attendance"]

Return STRICT JSON ARRAY only, with NO markdown formatting, NO markdown codeblock ticks.`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
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
        throw new Error('Empty response from Gemini place discovery');
      }

      const rawPlaces: any[] = JSON.parse(rawText);
      if (!Array.isArray(rawPlaces)) {
        throw new Error('Gemini response is not an array of places');
      }

      // Map raw items to typed PlaceModel with rich imagery
      const places: PlaceModel[] = rawPlaces.map((p, idx) => {
        const cat = (p.category || 'culture').toLowerCase();
        const photosList = CATEGORY_PHOTOS[cat] || CATEGORY_PHOTOS['culture'];
        const photoUrl = photosList[idx % photosList.length];

        return {
          id: p.id || `place-${Date.now()}-${idx}`,
          name: p.name || 'Historic Landmark',
          description: p.description || 'Famous landmark destination.',
          category: cat,
          latitude: typeof p.latitude === 'number' ? p.latitude : 25.612,
          longitude: typeof p.longitude === 'number' ? p.longitude : 85.144,
          address: p.address || `${p.name}, ${locationQuery}`,
          rating: typeof p.rating === 'number' ? p.rating : 4.6,
          reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 1200,
          openingHours: p.openingHours || '08:00 AM - 06:00 PM',
          entryFee: typeof p.entryFee === 'number' ? p.entryFee : 0,
          recommendedDuration: typeof p.recommendedDuration === 'number' ? p.recommendedDuration : 60,
          photos: [photoUrl],
          source: 'GEMINI_AI',
          badge: p.rating >= 4.7 ? 'Must Visit' : 'Popular',
          highlights: Array.isArray(p.highlights) ? p.highlights : ['Scenic Landmark', 'Historic Heritage'],
          localFoodTip: p.localFoodTip || 'Explore nearby street food market',
          crowdToday: p.crowdToday || 'Moderate Flow'
        };
      });

      logger.info(`Gemini AI discovered ${places.length} places for location: "${locationQuery}"`);
      return places;
    } catch (err) {
      logger.error(`Gemini place discovery failed for "${locationQuery}":`, err);
      return [];
    }
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

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;
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
