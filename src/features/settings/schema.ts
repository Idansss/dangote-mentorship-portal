import { z } from 'zod';

// Checkbox/switch values arrive from FormData as strings; coerce explicitly so
// an unchecked toggle (absent or "false"/"off") reads as false.
export const maintenanceModeSchema = z.object({
  enabled: z
    .union([z.literal('true'), z.literal('false'), z.literal('on'), z.literal('off')])
    .transform((v) => v === 'true' || v === 'on'),
});

export type MaintenanceModeInput = z.infer<typeof maintenanceModeSchema>;
