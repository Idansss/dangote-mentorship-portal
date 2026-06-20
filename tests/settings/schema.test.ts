import { describe, expect, it } from 'vitest';
import { maintenanceModeSchema } from '@/features/settings/schema';

describe('maintenanceModeSchema', () => {
  it('coerces "true" / "on" to enabled', () => {
    expect(maintenanceModeSchema.parse({ enabled: 'true' }).enabled).toBe(true);
    expect(maintenanceModeSchema.parse({ enabled: 'on' }).enabled).toBe(true);
  });

  it('coerces "false" / "off" to disabled', () => {
    expect(maintenanceModeSchema.parse({ enabled: 'false' }).enabled).toBe(false);
    expect(maintenanceModeSchema.parse({ enabled: 'off' }).enabled).toBe(false);
  });

  it('rejects anything that is not a recognised toggle value', () => {
    expect(() => maintenanceModeSchema.parse({ enabled: '1' })).toThrow();
    expect(() => maintenanceModeSchema.parse({ enabled: undefined })).toThrow();
  });
});
