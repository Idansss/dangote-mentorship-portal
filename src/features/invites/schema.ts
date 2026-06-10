import { z } from 'zod';
import { RoleName } from '@prisma/client';

export const createInviteSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email'),
  roleName: z.nativeEnum(RoleName),
  // Empty string from the form's "no cohort" option means a global role grant.
  cohortId: z
    .string()
    .trim()
    .optional()
    .transform((v) => (v ? v : null))
    .pipe(z.string().cuid().nullable()),
});

export const revokeInviteSchema = z.object({ id: z.string().cuid() });

export type CreateInviteInput = z.infer<typeof createInviteSchema>;
