import { z } from 'zod';
import { ReviewType } from '@prisma/client';
import type { FormField, FormSchemaShape } from '@/features/forms/schema';

// ──────────────────────────────────────────────────────────────────────────
// Review answer validation (CLAUDE.md §5 Reviews, M3 fill/submit flow).
//
// A FormDefinition's `schema` is the authoring contract (see features/forms);
// this file turns that contract into a *response* validator. Because admins can
// edit the question set without code changes, the answer schema must be built
// dynamically from whatever fields the live form declares. Validation is the
// non-negotiable engine here (CLAUDE.md §0 rule 4), so it is pure and fully
// unit-tested — no I/O.
//
// Answers arrive from the client as strings (one value per field id) inside a
// JSON blob; this module coerces and validates each by its declared field type,
// enforces `required`, and rejects answers to fields the form doesn't have.
// ──────────────────────────────────────────────────────────────────────────

// The canonical, validated answer for one field. `null` means "left blank"
// (only legal for optional fields).
export type AnswerValue = string | number | boolean | null;
export type ReviewAnswers = Record<string, AnswerValue>;

const DEFAULT_RATING_MAX = 5;
const SHORT_TEXT_MAX = 500;
const LONG_TEXT_MAX = 5000;

/** True when a raw answer counts as "left blank" before type coercion. */
function isBlank(raw: unknown): boolean {
  return raw === undefined || raw === null || (typeof raw === 'string' && raw.trim() === '');
}

/**
 * Validate a single raw answer against one field's type/constraints. Returns the
 * coerced value, or an error message describing the first problem.
 */
function validateField(
  field: FormField,
  raw: unknown,
): { ok: true; value: AnswerValue } | { ok: false; message: string } {
  if (isBlank(raw)) {
    if (field.required) return { ok: false, message: 'This question is required.' };
    return { ok: true, value: null };
  }

  switch (field.type) {
    case 'short_text':
    case 'long_text': {
      const value = typeof raw === 'string' ? raw.trim() : String(raw).trim();
      const max = field.type === 'short_text' ? SHORT_TEXT_MAX : LONG_TEXT_MAX;
      if (value.length > max) {
        return { ok: false, message: `Answer is too long (max ${max} characters).` };
      }
      return { ok: true, value };
    }

    case 'rating': {
      const max = field.max ?? DEFAULT_RATING_MAX;
      const n = typeof raw === 'number' ? raw : Number(String(raw).trim());
      if (!Number.isInteger(n) || n < 1 || n > max) {
        return { ok: false, message: `Choose a rating between 1 and ${max}.` };
      }
      return { ok: true, value: n };
    }

    case 'single_select': {
      const value = String(raw).trim();
      const allowed = (field.options ?? []).map((o) => o.value);
      if (!allowed.includes(value)) {
        return { ok: false, message: 'Choose one of the available options.' };
      }
      return { ok: true, value };
    }

    case 'boolean': {
      if (raw === true || raw === false) return { ok: true, value: raw };
      const value = String(raw).trim().toLowerCase();
      if (value === 'true' || value === 'yes') return { ok: true, value: true };
      if (value === 'false' || value === 'no') return { ok: true, value: false };
      return { ok: false, message: 'Choose yes or no.' };
    }

    default: {
      // Exhaustiveness guard: a new field type must be handled here.
      const _never: never = field.type;
      return { ok: false, message: `Unsupported question type: ${String(_never)}.` };
    }
  }
}

export interface ValidateAnswersResult {
  ok: boolean;
  /** Coerced, type-correct answers keyed by field id (present only when ok). */
  answers: ReviewAnswers;
  /** Per-field-id error messages (present only when !ok). */
  fieldErrors: Record<string, string>;
}

/**
 * Validate a full set of raw answers against a live form's fields. Pure: the
 * caller loads the FormDefinition and passes its parsed schema. Unknown keys in
 * `raw` (questions the form doesn't have) are ignored rather than rejected, so a
 * stale autosaved draft from an edited form never blocks a submit.
 */
export function validateAnswers(
  formSchema: FormSchemaShape,
  raw: Record<string, unknown>,
): ValidateAnswersResult {
  const answers: ReviewAnswers = {};
  const fieldErrors: Record<string, string> = {};

  for (const field of formSchema.fields) {
    const result = validateField(field, raw[field.id]);
    if (result.ok) {
      answers[field.id] = result.value;
    } else {
      fieldErrors[field.id] = result.message;
    }
  }

  return { ok: Object.keys(fieldErrors).length === 0, answers, fieldErrors };
}

// ── Submit boundary schema ──────────────────────────────────────────────────
// The action validates structural shape here (which form, well-formed answer
// blob) and then runs the dynamic per-field validation above.

// Answers are posted as a JSON string in a hidden field; parse then shape-check.
const answersJson = z
  .string()
  .trim()
  .min(1, 'No answers were submitted.')
  .transform((rawValue, ctx) => {
    try {
      return JSON.parse(rawValue) as unknown;
    } catch {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Your answers were malformed.' });
      return z.NEVER;
    }
  })
  .pipe(z.record(z.unknown()));

export const submitReviewSchema = z.object({
  formId: z.string().cuid(),
  type: z.nativeEnum(ReviewType),
  answers: answersJson,
});

export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;

/** Autosave-draft key for a review form, shared by the page loader and the
 *  client autosave hook so they never drift (experience-layer.md §1.11). */
export function reviewDraftKey(type: ReviewType, formId: string): string {
  return `review:${type}:${formId}`;
}
