import { z } from 'zod';

export const PlotCreateSchema = z.object({
  name: z.string().min(1).max(60),
});

export const ReadingsQuerySchema = z.object({
  plot_id: z.string().uuid(),
  since: z.string().datetime().optional(),
  limit: z.coerce.number().int().min(1).max(10000).optional().default(1000),
});

export const ThresholdUpsertSchema = z.object({
  plot_id: z.string().uuid(),
  parameter: z.enum(['moisture', 'temperature', 'light']),
  min_value: z.number().nullable(),
  max_value: z.number().nullable(),
});

export const NoteCreateSchema = z.object({
  plot_id: z.string().uuid(),
  body: z.string().min(1).max(500),
});
