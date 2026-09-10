import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('Places & Location API', () => {
  let app: express.Express;

  beforeAll(() => {
    app = createApp();
  });

  it('GET /api/location/search - returns geocoded coordinates for Patna', async () => {
    const res = await request(app)
      .get('/api/location/search')
      .query({ query: 'Patna' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThan(0);
    expect(res.body.data.results[0].city).toBe('Patna');
  });

  it('GET /api/places/nearby - returns nearby places for Patna coordinates', async () => {
    const res = await request(app)
      .get('/api/places/nearby')
      .query({
        latitude: 25.5941,
        longitude: 85.1376,
        radius: 10000,
        category: 'history'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.places.length).toBeGreaterThan(0);
    expect(res.body.data.places[0].category).toBe('history');
  });

  it('GET /api/places/:id - returns factual details for Golghar without inventing data', async () => {
    const res = await request(app)
      .get('/api/places/patna-golghar');

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.place.name).toBe('Golghar');
    expect(res.body.data.place.entryFee).toBe(15);
    expect(res.body.data.place.rating).toBe(4.4);
  });

  it('GET /api/places/:id - returns 404 for non-existent place', async () => {
    const res = await request(app)
      .get('/api/places/non-existent-place-12345');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/search - searches places by keyword across cities', async () => {
    const res = await request(app)
      .get('/api/search')
      .query({ q: 'Museum' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.results.length).toBeGreaterThan(0);
  });
});
