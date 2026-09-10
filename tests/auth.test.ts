import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';
import express from 'express';

describe('Authentication & User Profile API', () => {
  let app: express.Express;
  let authToken = '';
  const testUser = {
    name: 'Rupesh Raj',
    email: `rupesh.${Date.now()}@yatra.in`,
    password: 'SecurePassword123!'
  };

  beforeAll(() => {
    app = createApp();
  });

  it('POST /api/auth/register - successfully registers a new user', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user).toBeDefined();
    expect(res.body.data.user.email).toBe(testUser.email.toLowerCase());
    expect(res.body.data.user.passwordHash).toBeUndefined(); // Never leak passwordHash
    expect(res.body.data.token).toBeDefined();
    authToken = res.body.data.token;
  });

  it('POST /api/auth/register - rejects duplicate email registration', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(testUser);

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('USER_EXISTS');
  });

  it('POST /api/auth/login - logs in with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: testUser.password
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/auth/login - rejects invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUser.email,
        password: 'WrongPassword'
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET /api/auth/me - returns current user with valid bearer token', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe(testUser.name);
  });

  it('GET /api/auth/me - denies access without token', async () => {
    const res = await request(app)
      .get('/api/auth/me');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('GET & PUT /api/users/me/preferences - manages user preferences', async () => {
    const putRes = await request(app)
      .put('/api/users/me/preferences')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        interests: ['history', 'culture'],
        budgetPreference: '₹₹₹',
        travelStyle: 'relaxed'
      });

    expect(putRes.status).toBe(200);
    expect(putRes.body.success).toBe(true);
    expect(putRes.body.data.preferences.travelStyle).toBe('relaxed');

    const getRes = await request(app)
      .get('/api/users/me/preferences')
      .set('Authorization', `Bearer ${authToken}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.preferences.interests).toContain('history');
  });
});
