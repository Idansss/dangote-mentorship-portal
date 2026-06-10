import { z } from 'zod';
import { ProgrammeStatus } from '@prisma/client';

export const createProgrammeSchema = z.object({
  name: z.string().trim().min(2, 'Name is too short').max(160),
  description: z.string().trim().max(2000).optional().or(z.literal('')),
});

export const updateProgrammeSchema = createProgrammeSchema.extend({
  id: z.string().cuid(),
  status: z.nativeEnum(ProgrammeStatus),
});

export const archiveProgrammeSchema = z.object({ id: z.string().cuid() });

export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInput = z.infer<typeof updateProgrammeSchema>;
