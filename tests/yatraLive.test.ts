import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('YATRA LIVE Real-Time Replanning API', () => {
  let app: express.Express;
  let testTripId = '';

  beforeAll(async () => {
    app = createApp();

    // Create a base trip
    const res = await request(app)
      .post('/api/trips')
      .send({
        title: 'Varanasi Dawn Yatra',
        locationName: 'Varanasi',
        latitude: 25.3176,
        longitude: 82.9739,
        durationMinutes: 300,
        budget: 1200,
        stops: [
          { placeId: 'vns-kashi-vishwanath', order: 1, durationMinutes: 75 },
          { placeId: 'vns-dashashwamedh', order: 2, durationMinutes: 90 },
          { placeId: 'vns-assi-ghat', order: 3, durationMinutes: 60 }
        ]
      });

    testTripId = res.body.data.trip.id;
  });

  it('POST /api/trips/:tripId/recalculate - replaces an unavailable place with dynamic alternative', async () => {
    const res = await request(app)
      .post(`/api/trips/${testTripId}/recalculate`)
      .send({
        reason: 'PLACE_UNAVAILABLE',
        affectedStopId: 'vns-kashi-vishwanath',
        currentLocation: { latitude: 25.3176, longitude: 82.9739 },
        remainingTimeMinutes: 180,
        remainingBudget: 800
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip).toBeDefined();

    // Check that replacement took place
    const stops = res.body.data.trip.stops;
    const replacedStop = stops.find((s: any) => s.status === 'REPLACED' || s.notes?.includes('YATRA LIVE'));
    expect(replacedStop).toBeDefined();
    expect(res.body.data.trip.itinerary.estimatedTotalCost).toBeGreaterThan(0);
  });

  it('POST /api/trips/:tripId/recalculate - handles USER_RUNNING_LATE by optimizing remaining durations', async () => {
    const res = await request(app)
      .post(`/api/trips/${testTripId}/recalculate`)
      .send({
        reason: 'USER_RUNNING_LATE',
        currentLocation: { latitude: 25.3176, longitude: 82.9739 },
        remainingTimeMinutes: 90
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip.stops.length).toBe(3);
  });
});
