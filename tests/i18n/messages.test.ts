import { describe, expect, it } from 'vitest';
import en from '../../messages/en.json';
import fr from '../../messages/fr.json';
import { isAppLocale } from '@/i18n/config';

function flatten(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return value && typeof value === 'object'
      ? flatten(value as Record<string, unknown>, path)
      : [path];
  });
}

describe('i18n', () => {
  it('keeps EN and FR catalogs in sync (no missing translations)', () => {
    const enKeys = flatten(en).sort();
    const frKeys = flatten(fr).sort();
    expect(frKeys).toEqual(enKeys);
  });

  it('recognizes supported locales only', () => {
    expect(isAppLocale('en')).toBe(true);
    expect(isAppLocale('fr')).toBe(true);
    expect(isAppLocale('es')).toBe(false);
    expect(isAppLocale(undefined)).toBe(false);
  });
});
