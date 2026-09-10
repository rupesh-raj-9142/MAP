import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('Routes & Distance API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  it('POST /api/routes - calculates route legs between Patna landmarks', async () => {
    const res = await request(app)
      .post('/api/routes')
      .send({
        origin: { latitude: 25.6190, longitude: 85.1438 }, // Golghar
        destination: { latitude: 25.6080, longitude: 85.1220 }, // Bihar Museum
        waypoints: [{ latitude: 25.6267, longitude: 85.1482 }], // Sabhyata Dwar
        travelMode: 'DRIVE'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.route.totalDistanceMeters).toBeGreaterThan(0);
    expect(res.body.data.route.totalDurationMinutes).toBeGreaterThan(0);
    expect(res.body.data.route.legs.length).toBe(2);
  });

  it('POST /api/routes - rejects invalid coordinates', async () => {
    const res = await request(app)
      .post('/api/routes')
      .send({
        origin: { latitude: 999, longitude: 85.1438 },
        destination: { latitude: 25.6080, longitude: 85.1220 }
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});
