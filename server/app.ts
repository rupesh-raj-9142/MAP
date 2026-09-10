import express from 'express';
import cors from 'cors';
import path from 'path';

// Middlewares
import { requireAuth, optionalAuth } from './middleware/auth.middleware.js';
import { standardLimiter, authLimiter, aiLimiter } from './middleware/rateLimit.middleware.js';
import { validateBody, validateQuery } from './middleware/validate.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';

// Validators
import { RegisterSchema, LoginSchema } from './validators/auth.validator.js';
import { UpdateProfileSchema, UpdatePreferencesSchema } from './validators/user.validator.js';
import { LocationSearchQuerySchema } from './validators/location.validator.js';
import { NearbyPlacesQuerySchema, SearchPlacesQuerySchema } from './validators/places.validator.js';
import { RouteRequestSchema } from './validators/routes.validator.js';
import {
  CreateTripSchema,
  UpdateTripSchema,
  AddStopSchema,
  UpdateStopSchema,
  ReplaceStopSchema,
  YatraLiveRecalculateSchema
} from './validators/trip.validator.js';
import { AIPlanRequestSchema } from './validators/ai.validator.js';

// Controllers
import { AuthController } from './controllers/auth.controller.js';
import { UserController } from './controllers/user.controller.js';
import { LocationController } from './controllers/location.controller.js';
import { PlacesController } from './controllers/places.controller.js';
import { RoutesController } from './controllers/routes.controller.js';
import { TripsController } from './controllers/trips.controller.js';
import { SavedPlacesController } from './controllers/savedPlaces.controller.js';
import { AIController } from './controllers/ai.controller.js';

const projectRoot = process.cwd();

export function createApp(): express.Express {
  const app = express();

  // Global Middleware
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use('/api', standardLimiter);

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      version: '2.4.0',
      mockMode: process.env.USE_MOCK_DATA === 'true'
    });
  });

  // Controllers instantiation
  const authCtrl = new AuthController();
  const userCtrl = new UserController();
  const locCtrl = new LocationController();
  const placesCtrl = new PlacesController();
  const routesCtrl = new RoutesController();
  const tripsCtrl = new TripsController();
  const savedCtrl = new SavedPlacesController();
  const aiCtrl = new AIController();

  // 1. Authentication Routes
  app.post('/api/auth/register', authLimiter, validateBody(RegisterSchema), authCtrl.register);
  app.post('/api/auth/login', authLimiter, validateBody(LoginSchema), authCtrl.login);
  app.post('/api/auth/logout', optionalAuth, authCtrl.logout);
  app.get('/api/auth/me', requireAuth, authCtrl.me);

  // 2. User & Preferences Routes
  app.get('/api/users/me', requireAuth, userCtrl.getMe);
  app.put('/api/users/me', requireAuth, validateBody(UpdateProfileSchema), userCtrl.updateMe);
  app.get('/api/users/me/preferences', requireAuth, userCtrl.getPreferences);
  app.put('/api/users/me/preferences', requireAuth, validateBody(UpdatePreferencesSchema), userCtrl.updatePreferences);

  // 3. Location / Geocoding Routes
  app.get('/api/location/search', validateQuery(LocationSearchQuerySchema), locCtrl.search);

  // 4. Places Routes
  app.get('/api/places/nearby', validateQuery(NearbyPlacesQuerySchema), placesCtrl.getNearby);
  app.get('/api/places/:id', placesCtrl.getById);
  app.get('/api/search', validateQuery(SearchPlacesQuerySchema), placesCtrl.search);

  // 5. Routes & Distance Calculations
  app.post('/api/routes', validateBody(RouteRequestSchema), routesCtrl.calculateRoute);

  // 6. Trip CRUD Routes
  app.post('/api/trips', optionalAuth, validateBody(CreateTripSchema), tripsCtrl.createTrip);
  app.get('/api/trips', optionalAuth, tripsCtrl.getTrips);
  app.get('/api/trips/:id', optionalAuth, tripsCtrl.getTripById);
  app.put('/api/trips/:id', optionalAuth, validateBody(UpdateTripSchema), tripsCtrl.updateTrip);
  app.delete('/api/trips/:id', optionalAuth, tripsCtrl.deleteTrip);

  // 7. Trip Stop Routes
  app.post('/api/trips/:tripId/stops', optionalAuth, validateBody(AddStopSchema), tripsCtrl.addStop);
  app.patch('/api/trips/:tripId/stops/:stopId', optionalAuth, validateBody(UpdateStopSchema), tripsCtrl.updateStop);
  app.delete('/api/trips/:tripId/stops/:stopId', optionalAuth, tripsCtrl.removeStop);
  app.post('/api/trips/:tripId/stops/:stopId/replace', optionalAuth, validateBody(ReplaceStopSchema), tripsCtrl.replaceStop);
  app.post('/api/trips/:tripId/recalculate', optionalAuth, validateBody(YatraLiveRecalculateSchema), tripsCtrl.recalculate);

  // 8. Saved Places Routes
  app.post('/api/saved-places', optionalAuth, savedCtrl.save);
  app.get('/api/saved-places', optionalAuth, savedCtrl.getAll);
  app.delete('/api/saved-places/:placeId', optionalAuth, savedCtrl.remove);

  // 9. AI Trip Planner Route
  app.post('/api/ai/plan-trip', aiLimiter, optionalAuth, validateBody(AIPlanRequestSchema), aiCtrl.planTrip);

  // 10. Serve Static Frontend Files
  app.use(express.static(projectRoot));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(projectRoot, 'index.html'));
  });

  // Centralized error handler
  app.use(errorHandler);

  return app;
}
