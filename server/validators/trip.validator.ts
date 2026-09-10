import { z } from 'zod';

export const CreateTripSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters'),
  locationName: z.string().min(2, 'Location name is required'),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  durationMinutes: z.number().int().positive('Duration must be positive'),
  budget: z.number().min(0, 'Budget must be at least 0'),
  travelMood: z.string().optional(),
  travelGroup: z.string().optional(),
  transportPreference: z.string().optional(),
  stops: z.array(z.object({
    placeId: z.string().min(1, 'Place ID is required'),
    order: z.number().int().positive(),
    durationMinutes: z.number().int().positive(),
    notes: z.string().optional()
  })).min(1, 'At least one stop is required')
});

export const UpdateTripSchema = z.object({
  title: z.string().min(2).optional(),
  budget: z.number().min(0).optional(),
  durationMinutes: z.number().int().positive().optional(),
  travelMood: z.string().optional(),
  travelGroup: z.string().optional(),
  transportPreference: z.string().optional(),
  status: z.enum(['DRAFT', 'PLANNED', 'ACTIVE', 'COMPLETED', 'CANCELLED']).optional()
});

export const AddStopSchema = z.object({
  placeId: z.string().min(1, 'Place ID is required'),
  durationMinutes: z.number().int().min(10).optional().default(45)
});

export const UpdateStopSchema = z.object({
  status: z.enum(['PENDING', 'CURRENT', 'COMPLETED', 'SKIPPED', 'REPLACED']).optional(),
  durationMinutes: z.number().int().positive().optional(),
  notes: z.string().optional()
});

export const ReplaceStopSchema = z.object({
  newPlaceId: z.string().min(1, 'Replacement place ID is required')
});

export const YatraLiveRecalculateSchema = z.object({
  reason: z.enum([
    'PLACE_UNAVAILABLE',
    'USER_RUNNING_LATE',
    'TRAFFIC_CHANGE',
    'TIME_REDUCED',
    'BUDGET_CHANGED',
    'STOP_SKIPPED',
    'WEATHER_CHANGE'
  ]).optional().default('PLACE_UNAVAILABLE'),
  affectedStopId: z.string().optional(),
  currentLocation: z.object({
    latitude: z.number(),
    longitude: z.number()
  }).optional(),
  remainingTimeMinutes: z.number().int().positive().optional(),
  remainingBudget: z.number().min(0).optional()
});
