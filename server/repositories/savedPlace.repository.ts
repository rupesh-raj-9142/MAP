import { PlaceModel } from '../../types/index.js';
import { getPrismaClient, isDatabaseActive } from './db.js';
import { PlaceRepository } from './place.repository.js';

interface InMemorySaved {
  id: string;
  userId: string;
  placeId: string;
  createdAt: Date;
}

const memorySaved = new Map<string, InMemorySaved>();

export class SavedPlaceRepository {
  private placeRepo = new PlaceRepository();

  async savePlace(userId: string, placeId: string): Promise<{ id: string; place: PlaceModel | null }> {
    const place = await this.placeRepo.findById(placeId);

    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const saved = await client.savedPlace.upsert({
          where: {
            userId_placeId: { userId, placeId }
          },
          update: {},
          create: {
            userId,
            placeId
          },
          include: { place: true }
        });
        return {
          id: saved.id,
          place
        };
      } catch {
        // Fallback to memory
      }
    }

    const key = `${userId}:${placeId}`;
    let saved = memorySaved.get(key);
    if (!saved) {
      saved = {
        id: 'saved-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        userId,
        placeId,
        createdAt: new Date()
      };
      memorySaved.set(key, saved);
    }

    return {
      id: saved.id,
      place
    };
  }

  async getSavedPlaces(userId: string): Promise<PlaceModel[]> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const list = await client.savedPlace.findMany({
          where: { userId },
          include: { place: true },
          orderBy: { createdAt: 'desc' }
        });
        if (list.length > 0) {
          const places: PlaceModel[] = [];
          for (const item of list) {
            const p = await this.placeRepo.findById(item.placeId);
            if (p) places.push(p);
          }
          return places;
        }
      } catch {
        // Fallback to memory
      }
    }

    const places: PlaceModel[] = [];
    for (const item of memorySaved.values()) {
      if (item.userId === userId) {
        const p = await this.placeRepo.findById(item.placeId);
        if (p) places.push(p);
      }
    }
    return places;
  }

  async removeSavedPlace(userId: string, placeId: string): Promise<boolean> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        await client.savedPlace.deleteMany({
          where: { userId, placeId }
        });
        return true;
      } catch {
        // Fallback to memory
      }
    }

    const key = `${userId}:${placeId}`;
    return memorySaved.delete(key);
  }
}
