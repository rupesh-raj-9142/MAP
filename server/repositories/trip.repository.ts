import { TripModel, TripStopModel, ItineraryModel, StopStatus, TripStatus } from '../../types/index.js';
import { getPrismaClient, isDatabaseActive } from './db.js';
import { PlaceRepository } from './place.repository.js';

const memoryTrips = new Map<string, TripModel>();

export class TripRepository {
  private placeRepo = new PlaceRepository();

  async create(trip: TripModel): Promise<TripModel> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const created = await client.trip.create({
          data: {
            id: trip.id,
            userId: trip.userId,
            title: trip.title,
            locationName: trip.locationName,
            latitude: trip.latitude,
            longitude: trip.longitude,
            durationMinutes: trip.durationMinutes,
            budget: trip.budget,
            travelMood: trip.travelMood,
            travelGroup: trip.travelGroup,
            transportPreference: trip.transportPreference,
            status: trip.status as any,
            stops: {
              create: trip.stops.map(s => ({
                id: s.id,
                placeId: s.placeId,
                order: s.order,
                startTime: s.startTime,
                durationMinutes: s.durationMinutes,
                travelTimeMinutes: s.travelTimeMinutes,
                travelDistanceMeters: s.travelDistanceMeters,
                estimatedCost: s.estimatedCost,
                notes: s.notes,
                status: s.status as any
              }))
            },
            ...(trip.itinerary ? {
              itinerary: {
                create: {
                  id: trip.itinerary.id,
                  totalDurationMinutes: trip.itinerary.totalDurationMinutes,
                  totalDistanceMeters: trip.itinerary.totalDistanceMeters,
                  estimatedTotalCost: trip.itinerary.estimatedTotalCost,
                  reasoningSummary: trip.itinerary.reasoningSummary
                }
              }
            } : {})
          },
          include: {
            stops: {
              include: { place: true },
              orderBy: { order: 'asc' }
            },
            itinerary: true
          }
        });
        return this.mapPrismaToTrip(created);
      } catch {
        // Fallback to memory
      }
    }

    // Populate places on stops if available
    for (const stop of trip.stops) {
      if (!stop.place) {
        const p = await this.placeRepo.findById(stop.placeId);
        if (p) stop.place = p;
      }
    }

    memoryTrips.set(trip.id, { ...trip });
    return trip;
  }

  async findById(id: string, userId?: string): Promise<TripModel | null> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const where: any = { id };
        if (userId) where.userId = userId;

        const found = await client.trip.findFirst({
          where,
          include: {
            stops: {
              include: { place: true },
              orderBy: { order: 'asc' }
            },
            itinerary: true
          }
        });
        if (found) {
          return this.mapPrismaToTrip(found);
        }
      } catch {
        // Fallback to memory
      }
    }

    const trip = memoryTrips.get(id);
    if (!trip) return null;
    if (userId && trip.userId !== userId) return null;
    return trip;
  }

  async findByUserId(userId: string): Promise<TripModel[]> {
    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const found = await client.trip.findMany({
          where: { userId },
          include: {
            stops: {
              include: { place: true },
              orderBy: { order: 'asc' }
            },
            itinerary: true
          },
          orderBy: { createdAt: 'desc' }
        });
        if (found.length > 0) {
          return found.map(t => this.mapPrismaToTrip(t));
        }
      } catch {
        // Fallback to memory
      }
    }

    const results: TripModel[] = [];
    for (const t of memoryTrips.values()) {
      if (t.userId === userId) {
        results.push(t);
      }
    }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async update(id: string, userId: string, data: Partial<TripModel>): Promise<TripModel | null> {
    const existing = await this.findById(id, userId);
    if (!existing) return null;

    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        const updated = await client.trip.update({
          where: { id },
          data: {
            title: data.title,
            status: data.status as any,
            budget: data.budget,
            durationMinutes: data.durationMinutes,
            travelMood: data.travelMood,
            travelGroup: data.travelGroup,
            transportPreference: data.transportPreference
          },
          include: {
            stops: {
              include: { place: true },
              orderBy: { order: 'asc' }
            },
            itinerary: true
          }
        });
        return this.mapPrismaToTrip(updated);
      } catch {
        // Fallback to memory
      }
    }

    const updatedTrip: TripModel = {
      ...existing,
      ...data,
      updatedAt: new Date()
    };
    memoryTrips.set(id, updatedTrip);
    return updatedTrip;
  }

  async delete(id: string, userId: string): Promise<boolean> {
    const existing = await this.findById(id, userId);
    if (!existing) return false;

    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        await client.trip.delete({ where: { id } });
        return true;
      } catch {
        // Fallback to memory
      }
    }

    return memoryTrips.delete(id);
  }

  async updateStopsAndItinerary(
    tripId: string,
    userId: string,
    stops: TripStopModel[],
    itinerary: ItineraryModel
  ): Promise<TripModel | null> {
    const existing = await this.findById(tripId, userId);
    if (!existing) return null;

    if (isDatabaseActive()) {
      try {
        const client = getPrismaClient();
        await client.$transaction([
          client.tripStop.deleteMany({ where: { tripId } }),
          client.tripStop.createMany({
            data: stops.map(s => ({
              id: s.id,
              tripId,
              placeId: s.placeId,
              order: s.order,
              startTime: s.startTime,
              durationMinutes: s.durationMinutes,
              travelTimeMinutes: s.travelTimeMinutes,
              travelDistanceMeters: s.travelDistanceMeters,
              estimatedCost: s.estimatedCost,
              notes: s.notes,
              status: s.status as any
            }))
          }),
          client.itinerary.upsert({
            where: { tripId },
            update: {
              totalDurationMinutes: itinerary.totalDurationMinutes,
              totalDistanceMeters: itinerary.totalDistanceMeters,
              estimatedTotalCost: itinerary.estimatedTotalCost,
              reasoningSummary: itinerary.reasoningSummary
            },
            create: {
              id: itinerary.id,
              tripId,
              totalDurationMinutes: itinerary.totalDurationMinutes,
              totalDistanceMeters: itinerary.totalDistanceMeters,
              estimatedTotalCost: itinerary.estimatedTotalCost,
              reasoningSummary: itinerary.reasoningSummary
            }
          })
        ]);

        return this.findById(tripId, userId);
      } catch {
        // Fallback to memory
      }
    }

    // Memory fallback
    for (const stop of stops) {
      if (!stop.place) {
        const p = await this.placeRepo.findById(stop.placeId);
        if (p) stop.place = p;
      }
    }

    existing.stops = stops;
    existing.itinerary = itinerary;
    existing.stopsCount = stops.length;
    existing.durationMinutes = itinerary.totalDurationMinutes;
    existing.estimatedCost = itinerary.estimatedTotalCost;
    existing.distanceKm = itinerary.totalDistanceKm;
    existing.updatedAt = new Date();

    memoryTrips.set(tripId, existing);
    return existing;
  }

  private mapPrismaToTrip(t: any): TripModel {
    const hours = Math.floor(t.durationMinutes / 60);
    const mins = t.durationMinutes % 60;
    const durationDisplay = `${hours}h ${mins > 0 ? mins + 'm' : '00m'}`;
    const distanceKm = t.itinerary ? parseFloat((t.itinerary.totalDistanceMeters / 1000).toFixed(1)) : 5.0;

    return {
      id: t.id,
      userId: t.userId,
      title: t.title,
      locationName: t.locationName,
      latitude: t.latitude,
      longitude: t.longitude,
      durationMinutes: t.durationMinutes,
      budget: t.budget,
      travelMood: t.travelMood,
      travelGroup: t.travelGroup,
      transportPreference: t.transportPreference,
      status: t.status,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
      duration: durationDisplay,
      stopsCount: t.stops?.length || 0,
      estimatedCost: t.itinerary?.estimatedTotalCost || 0,
      maxBudget: t.budget,
      distanceKm,
      efficiencyScore: '100% Zero-Backtrack',
      image: t.stops?.[0]?.place?.photos?.[0] || 'https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=800&q=80',
      stops: (t.stops || []).map((s: any) => ({
        id: s.id,
        tripId: s.tripId,
        placeId: s.placeId,
        order: s.order,
        startTime: s.startTime,
        durationMinutes: s.durationMinutes,
        travelTimeMinutes: s.travelTimeMinutes,
        travelDistanceMeters: s.travelDistanceMeters,
        estimatedCost: s.estimatedCost,
        notes: s.notes,
        status: s.status,
        place: s.place ? {
          ...s.place,
          badge: `${s.place.category.toUpperCase()} Stop`,
          highlights: [],
          localFoodTip: "Specialty refreshments available"
        } : undefined,
        transitNext: s.travelTimeMinutes > 0 ? `${s.travelTimeMinutes}m via Transit` : 'Tour Concludes'
      })),
      itinerary: t.itinerary ? {
        id: t.itinerary.id,
        tripId: t.itinerary.tripId,
        totalDurationMinutes: t.itinerary.totalDurationMinutes,
        totalDistanceMeters: t.itinerary.totalDistanceMeters,
        totalDistanceKm: parseFloat((t.itinerary.totalDistanceMeters / 1000).toFixed(1)),
        estimatedTotalCost: t.itinerary.estimatedTotalCost,
        reasoningSummary: t.itinerary.reasoningSummary
      } : null
    };
  }
}
