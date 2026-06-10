import { z } from 'zod';
import { CohortStatus, Language } from '@prisma/client';

const optionalDate = z
  .string()
  .trim()
  .optional()
  .transform((v) => (v ? new Date(v) : null))
  .refine((d) => d === null || !Number.isNaN(d.getTime()), 'Invalid date');

export const createCohortSchema = z.object({
  programmeId: z.string().cuid(),
  name: z.string().trim().min(2, 'Name is too short').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
  startDate: optionalDate,
  endDate: optionalDate,
  // At least one language must be offered (CLAUDE.md §1: EN + FR).
  languages: z.array(z.nativeEnum(Language)).min(1, 'Select at least one language'),
});

export const updateCohortSchema = createCohortSchema.extend({
  id: z.string().cuid(),
  status: z.nativeEnum(CohortStatus),
});

export const archiveCohortSchema = z.object({ id: z.string().cuid() });

export type CreateCohortInput = z.infer<typeof createCohortSchema>;
export type UpdateCohortInput = z.infer<typeof updateCohortSchema>;
