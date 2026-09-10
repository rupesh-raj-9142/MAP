import { z } from 'zod';

const CoordinateSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export const RouteRequestSchema = z.object({
  origin: CoordinateSchema,
  destination: CoordinateSchema,
  waypoints: z.array(CoordinateSchema).optional().default([]),
  travelMode: z.enum(['WALK', 'DRIVE', 'BICYCLE', 'TRANSIT']).optional().default('DRIVE')
});
