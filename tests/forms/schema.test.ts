import { describe, expect, it } from 'vitest';
import {
  createFormDefinitionSchema,
  formSchemaShape,
  type FormSchemaShape,
} from '@/features/forms/schema';

// The form `schema` JSON is the contract both the builder and the review-fill
// flow depend on, so it gets full unit coverage (CLAUDE.md §0 rule 4 spirit:
// validation is non-negotiable).

function field(overrides: Record<string, unknown> = {}) {
  return {
    id: 'q_one',
    labelEn: 'How did it go?',
    labelFr: 'Comment cela s’est-il passé ?',
    type: 'long_text',
    required: true,
    ...overrides,
  };
}

describe('formSchemaShape', () => {
  it('accepts a minimal valid form', () => {
    const result = formSchemaShape.safeParse({ fields: [field()] });
    expect(result.success).toBe(true);
  });

  it('rejects a form with no questions', () => {
    const result = formSchemaShape.safeParse({ fields: [] });
    expect(result.success).toBe(false);
  });

  it('rejects duplicate field ids', () => {
    const result = formSchemaShape.safeParse({
      fields: [field({ id: 'dupe' }), field({ id: 'dupe', labelEn: 'Second', labelFr: 'Deux' })],
    });
    expect(result.success).toBe(false);
  });

  it('requires both EN and FR labels on every question', () => {
    expect(formSchemaShape.safeParse({ fields: [field({ labelFr: '' })] }).success).toBe(false);
    expect(formSchemaShape.safeParse({ fields: [field({ labelEn: '' })] }).success).toBe(false);
  });

  it('rejects a non-alphanumeric field id', () => {
    expect(formSchemaShape.safeParse({ fields: [field({ id: 'bad id!' })] }).success).toBe(false);
  });

  it('requires at least two options for a single_select question', () => {
    const oneOption = formSchemaShape.safeParse({
      fields: [
        field({
          type: 'single_select',
          options: [{ value: 'a', labelEn: 'A', labelFr: 'A' }],
        }),
      ],
    });
    expect(oneOption.success).toBe(false);

    const twoOptions = formSchemaShape.safeParse({
      fields: [
        field({
          type: 'single_select',
          options: [
            { value: 'a', labelEn: 'A', labelFr: 'A' },
            { value: 'b', labelEn: 'B', labelFr: 'B' },
          ],
        }),
      ],
    });
    expect(twoOptions.success).toBe(true);
  });

  it('clamps rating bounds to 2..10', () => {
    expect(formSchemaShape.safeParse({ fields: [field({ type: 'rating', max: 1 })] }).success).toBe(
      false,
    );
    expect(formSchemaShape.safeParse({ fields: [field({ type: 'rating', max: 11 })] }).success).toBe(
      false,
    );
    expect(formSchemaShape.safeParse({ fields: [field({ type: 'rating', max: 5 })] }).success).toBe(
      true,
    );
  });

  it('defaults required to false when omitted', () => {
    const parsed = formSchemaShape.parse({ fields: [field({ required: undefined })] }) as FormSchemaShape;
    expect(parsed.fields[0]?.required).toBe(false);
  });
});

describe('createFormDefinitionSchema', () => {
  const validSchemaJson = JSON.stringify({ fields: [field()] });

  it('parses a full valid payload and coerces an empty role to null', () => {
    const result = createFormDefinitionSchema.safeParse({
      cohortId: 'ckv1234567890abcdefghijklm',
      type: 'MIDTERM',
      roleName: '',
      title: 'Mid-term mentee review',
      schema: validSchemaJson,
      isActive: 'true',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.roleName).toBeNull();
      expect(result.data.schema.fields).toHaveLength(1);
    }
  });

  it('keeps a concrete target role', () => {
    const result = createFormDefinitionSchema.safeParse({
      cohortId: 'ckv1234567890abcdefghijklm',
      type: 'FINAL',
      roleName: 'MENTOR',
      title: 'Final mentor review',
      schema: validSchemaJson,
      isActive: 'true',
    });
    expect(result.success && result.data.roleName).toBe('MENTOR');
  });

  it('rejects malformed schema JSON', () => {
    const result = createFormDefinitionSchema.safeParse({
      cohortId: 'ckv1234567890abcdefghijklm',
      type: 'MIDTERM',
      roleName: '',
      title: 'Broken',
      schema: '{ not json',
      isActive: 'true',
    });
    expect(result.success).toBe(false);
  });

  it('rejects an invalid review type', () => {
    const result = createFormDefinitionSchema.safeParse({
      cohortId: 'ckv1234567890abcdefghijklm',
      type: 'WEEKLY',
      roleName: '',
      title: 'Bad type',
      schema: validSchemaJson,
      isActive: 'true',
    });
    expect(result.success).toBe(false);
  });
});
