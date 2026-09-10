import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('AI Trip Planner API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  it('POST /api/ai/plan-trip - generates a verified itinerary with 4 hours and ₹1000 budget', async () => {
    const res = await request(app)
      .post('/api/ai/plan-trip')
      .send({
        location: { city: 'Patna' },
        availableTimeMinutes: 240,
        budget: 1000,
        interests: ['history', 'food'],
        mood: 'relaxed',
        travelGroup: 'friends',
        transportPreference: 'walking'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.trip).toBeDefined();
    expect(res.body.data.trip.title).toBeDefined();
    expect(res.body.data.trip.stops.length).toBeGreaterThanOrEqual(2);
    // Verifies backend source of truth for budget and stops
    expect(res.body.data.trip.itinerary.estimatedTotalCost).toBeLessThanOrEqual(1000);
    expect(res.body.data.trip.itinerary.totalDurationMinutes).toBeGreaterThan(0);
  }, 15000);

  it('POST /api/ai/plan-trip - rejects invalid planner request (negative budget)', async () => {
    const res = await request(app)
      .post('/api/ai/plan-trip')
      .send({
        location: { city: 'Patna' },
        availableTimeMinutes: 240,
        budget: -500,
        interests: ['history']
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/ai/plan-trip - rejects missing interests', async () => {
    const res = await request(app)
      .post('/api/ai/plan-trip')
      .send({
        location: { city: 'Patna' },
        availableTimeMinutes: 240,
        budget: 1000,
        interests: []
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
