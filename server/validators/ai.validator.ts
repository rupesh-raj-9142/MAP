import { z } from 'zod';

export const AIPlannedStopSchema = z.object({
  placeId: z.string().min(1, 'Place ID is required'),
  order: z.number().int().positive('Order must be a positive integer'),
  durationMinutes: z.number().int().min(15).max(360, 'Duration between 15m and 6h'),
  reason: z.string().min(1, 'Reasoning must be provided')
});

export const AIPlanOutputSchema = z.object({
  title: z.string().min(3, 'Trip title must be at least 3 characters'),
  stops: z.array(AIPlannedStopSchema).min(1, 'Trip must have at least one stop'),
  reasoningSummary: z.string().optional()
});

export const AIPlanRequestSchema = z.object({
  location: z.object({
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    city: z.string().optional(),
    address: z.string().optional()
  }).refine(data => data.city || (data.latitude !== undefined && data.longitude !== undefined), {
    message: 'Either city or coordinates (latitude, longitude) must be provided'
  }),
  availableTimeMinutes: z.number().int().min(30).max(1440, 'Available time must be between 30 mins and 24 hours'),
  budget: z.number().min(0, 'Budget cannot be negative'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  mood: z.string().optional(),
  travelGroup: z.string().optional(),
  transportPreference: z.string().optional()
});
