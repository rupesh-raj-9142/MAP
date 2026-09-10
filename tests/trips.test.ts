import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('Trip CRUD & Stop Management API', () => {
  let app: express.Express;
  let userTokenA = '';
  let userTokenB = '';
  let createdTripId = '';

  beforeAll(async () => {
    app = createApp();

    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Traveler A',
        email: `traveler.a.${Date.now()}@yatra.in`,
        password: 'Password123!'
      });
    userTokenA = resA.body.data.token;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Traveler B',
        email: `traveler.b.${Date.now()}@yatra.in`,
        password: 'Password123!'
      });
    userTokenB = resB.body.data.token;
  });

  it('POST /api/trips - creates a new custom trip with stops', async () => {
    const res = await request(app)
      .post('/api/trips')
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        title: 'Patna Heritage Expedition',
        locationName: 'Patna',
        latitude: 25.5941,
        longitude: 85.1376,
        durationMinutes: 240,
        budget: 1000,
        stops: [
          { placeId: 'patna-golghar', order: 1, durationMinutes: 45 },
          { placeId: 'patna-bihar-museum', order: 2, durationMinutes: 90 }
        ]
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip.title).toBe('Patna Heritage Expedition');
    expect(res.body.data.trip.stops.length).toBe(2);
    expect(res.body.data.trip.itinerary).toBeDefined();
    createdTripId = res.body.data.trip.id;
  });

  it('GET /api/trips/:id - retrieves trip for owner', async () => {
    const res = await request(app)
      .get(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip.id).toBe(createdTripId);
  });

  it('GET /api/trips/:id - prevents unauthorized user from accessing another user trip', async () => {
    const res = await request(app)
      .get(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${userTokenB}`);

    expect(res.status).toBe(404); // Scoped ownership lookup returns not found or denied
    expect(res.body.success).toBe(false);
  });

  it('POST /api/trips/:id/stops - adds a new stop and recalculates route', async () => {
    const res = await request(app)
      .post(`/api/trips/${createdTripId}/stops`)
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        placeId: 'patna-buddha-smriti',
        durationMinutes: 60
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip.stops.length).toBe(3);
  });

  it('POST /api/trips/:id/stops/:stopId/replace - replaces stop with another place', async () => {
    const res = await request(app)
      .post(`/api/trips/${createdTripId}/stops/patna-golghar/replace`)
      .set('Authorization', `Bearer ${userTokenA}`)
      .send({
        newPlaceId: 'patna-sabhyata-dwar'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const replacedStop = res.body.data.trip.stops.find((s: any) => s.placeId === 'patna-sabhyata-dwar');
    expect(replacedStop).toBeDefined();
    expect(replacedStop.status).toBe('REPLACED');
  });

  it('DELETE /api/trips/:id - deletes trip', async () => {
    const res = await request(app)
      .delete(`/api/trips/${createdTripId}`)
      .set('Authorization', `Bearer ${userTokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});
