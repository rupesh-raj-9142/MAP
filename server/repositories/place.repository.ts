import { PlaceModel } from '../../types/index.js';
import { getPrismaClient, isDatabaseActive } from './db.js';
import { SEED_PLACES } from '../integrations/places/seedData.js';

const memoryPlaces = new Map<string, PlaceModel>();

// Prepopulate in-memory storage with seed places
for (const p of SEED_PLACES) {
  memoryPlaces.set(p.id, { ...p });
}

export class PlaceRepository {
  async findById(id: string): Promise<PlaceModel | null> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const found = await client.place.findUnique({
          where: { id }
        });
        if (found) {
          return this.mapPrismaToPlace(found);
        }
      } catch {
        // Fallback to memory
      }
    }
    return memoryPlaces.get(id) || null;
  }

  async findByExternalId(externalId: string): Promise<PlaceModel | null> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const found = await client.place.findUnique({
          where: { externalId }
        });
        if (found) {
          return this.mapPrismaToPlace(found);
        }
      } catch {
        // Fallback to memory
      }
    }
    for (const p of memoryPlaces.values()) {
      if (p.externalId === externalId) return p;
    }
    return null;
  }

  async findAll(options?: { category?: string; search?: string; limit?: number; offset?: number }): Promise<PlaceModel[]> {
    const limit = options?.limit || 50;
    const offset = options?.offset || 0;

    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const where: any = {};
        if (options?.category && options.category !== 'all') {
          where.category = options.category;
        }
        if (options?.search) {
          where.OR = [
            { name: { contains: options.search, mode: 'insensitive' } },
            { description: { contains: options.search, mode: 'insensitive' } },
            { address: { contains: options.search, mode: 'insensitive' } }
          ];
        }
        const found = await client.place.findMany({
          where,
          take: limit,
          skip: offset
        });
        if (found.length > 0) {
          return found.map(p => this.mapPrismaToPlace(p));
        }
      } catch {
        // Fallback to memory
      }
    }

    let results = Array.from(memoryPlaces.values());
    if (options?.category && options.category !== 'all') {
      results = results.filter(p => p.category.toLowerCase() === options.category!.toLowerCase());
    }
    if (options?.search) {
      const q = options.search.toLowerCase();
      results = results.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.address.toLowerCase().includes(q)
      );
    }
    return results.slice(offset, offset + limit);
  }

  async upsert(place: PlaceModel): Promise<PlaceModel> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const upserted = await client.place.upsert({
          where: { externalId: place.externalId || place.id },
          update: {
            name: place.name,
            description: place.description,
            category: place.category,
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.address,
            rating: place.rating,
            reviewCount: place.reviewCount,
            phoneNumber: place.phoneNumber,
            website: place.website,
            openingHours: place.openingHours,
            priceLevel: place.priceLevel,
            entryFee: place.entryFee,
            recommendedDuration: place.recommendedDuration,
            photos: place.photos,
            source: place.source
          },
          create: {
            id: place.id,
            externalId: place.externalId || place.id,
            name: place.name,
            description: place.description,
            category: place.category,
            latitude: place.latitude,
            longitude: place.longitude,
            address: place.address,
            rating: place.rating,
            reviewCount: place.reviewCount,
            phoneNumber: place.phoneNumber,
            website: place.website,
            openingHours: place.openingHours,
            priceLevel: place.priceLevel,
            entryFee: place.entryFee,
            recommendedDuration: place.recommendedDuration,
            photos: place.photos,
            source: place.source
          }
        });
        return this.mapPrismaToPlace(upserted);
      } catch {
        // Fallback to memory
      }
    }

    memoryPlaces.set(place.id, { ...place });
    return place;
  }

  private mapPrismaToPlace(p: any): PlaceModel {
    const seedMatch = SEED_PLACES.find(s => s.id === p.id || s.externalId === p.externalId);
    return {
      id: p.id,
      externalId: p.externalId,
      name: p.name,
      description: p.description,
      category: p.category,
      latitude: p.latitude,
      longitude: p.longitude,
      address: p.address,
      rating: p.rating,
      reviewCount: p.reviewCount,
      phoneNumber: p.phoneNumber,
      website: p.website,
      openingHours: p.openingHours,
      priceLevel: p.priceLevel,
      entryFee: p.entryFee,
      recommendedDuration: p.recommendedDuration,
      photos: p.photos || [],
      source: p.source,
      badge: seedMatch?.badge || `${p.category.toUpperCase()} Highlight`,
      highlights: seedMatch?.highlights || [],
      crowdToday: seedMatch?.crowdToday || "Moderate Flow",
      crowdByHour: seedMatch?.crowdByHour || [15, 30, 50, 65, 75, 70, 55, 35, 10],
      recommendedTransit: seedMatch?.recommendedTransit || "Local Transit or Auto",
      localFoodTip: seedMatch?.localFoodTip || "Local specialty stalls nearby"
    };
  }
}
