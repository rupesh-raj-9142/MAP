import { z } from 'zod';

export const LocationSearchQuerySchema = z.object({
  query: z.string().min(2, 'Query must be at least 2 characters')
});
