import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  image: z.string().url().nullable().optional()
});

export const UpdatePreferencesSchema = z.object({
  interests: z.array(z.string()).optional(),
  budgetPreference: z.string().nullable().optional(),
  travelStyle: z.string().nullable().optional(),
  transportPreference: z.string().nullable().optional(),
  favoriteCategories: z.array(z.string()).optional()
});
