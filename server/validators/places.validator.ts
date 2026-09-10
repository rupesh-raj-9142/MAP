import { z } from 'zod';

export const NearbyPlacesQuerySchema = z.object({
  latitude: z.coerce.number().min(-90).max(90),
  longitude: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().optional().default(10000), // Default 10km (supports 5000, 10000, 20000)
  category: z.string().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});

export const SearchPlacesQuerySchema = z.object({
  q: z.string().min(1, 'Search term cannot be empty'),
  city: z.string().optional(),
  category: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20)
});
