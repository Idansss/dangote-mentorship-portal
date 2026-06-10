'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { Prisma, ReviewStatus, ReviewType, RoleName } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireUser, requireRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { writeAuditLog } from '@/lib/audit/audit';
import { getAiAdapter } from '@/lib/ai';
import { fail, mapActionError, ok, type ActionResult } from '@/lib/actions/result';
import { getFormDefinition } from '@/features/forms/data';
import { ensureReviewCycle, resolveReviewParticipant } from './data';
import {
  getReviewRollup,
  resolveReviewerCohortId,
  type ReviewTypeSummary,
} from './rollup';
import {
  aggregateToLine,
  buildReviewReportPrompt,
  parseReviewReportResponse,
  type ReviewReport,
} from './assistant';
import { submitReviewSchema, validateAnswers } from './schema';

// Review fill/submit mutation (CLAUDE.md §5, M3). Follows the §3 pipeline:
// authenticate → authorize (must be a paired participant) → validate (Zod +
// dynamic per-field answer validation) → execute → audit → typed result. The
// audit row carries only metadata (form id, field count) — never answer bodies
// (§14: no sensitive content in logs).

const REVIEW_PATH: Record<ReviewType, string> = {
  [ReviewType.MIDTERM]: '/mid-term-review',
  [ReviewType.FINAL]: '/final-review',
};

export async function submitReviewResponse(
  formData: FormData,
): Promise<ActionResult<{ responseId: string }>> {
  try {
    const user = await requireUser();

    const input = submitReviewSchema.parse({
      formId: formData.get('formId'),
      type: formData.get('type'),
      answers: formData.get('answers'),
    });

    // Authorize: only a paired mentor/mentee fills a review.
    const participant = await resolveReviewParticipant(user);
    if (!participant) {
      return fail({
        code: 'FORBIDDEN',
        message: 'Only matched mentors and mentees can submit a review.',
      });
    }

    // Cohort-isolation guard: the form must belong to the respondent's own
    // cohort, match the claimed type, and be live (defends against IDOR /
    // cross-cohort submission — cf. M2 audit finding H1 spirit).
    const form = await getFormDefinition(input.formId);
    if (
      !form ||
      form.cohortId !== participant.cohortId ||
      form.type !== input.type ||
      !form.isActive
    ) {
      return fail({ code: 'NOT_FOUND', message: 'This review form is not available.' });
    }

    // Dynamic per-field validation against the live question set.
    const validated = validateAnswers(form.schema, input.answers);
    if (!validated.ok) {
      return fail({
        code: 'VALIDATION',
        message: 'Some answers need attention.',
        fieldErrors: Object.fromEntries(
          Object.entries(validated.fieldErrors).map(([k, v]) => [k, [v]]),
        ),
      });
    }

    const cycleId = await ensureReviewCycle(participant.cohortId, input.type);
    const answersJson = validated.answers as Prisma.InputJsonValue;
    const link =
      input.type === ReviewType.MIDTERM
        ? { midtermReviewId: cycleId }
        : { finalReviewId: cycleId };

    // One submission per respondent per form: update in place if they re-open it,
    // otherwise create. Both stay status SUBMITTED with a fresh submittedAt.
    const existing = await prisma.formResponse.findFirst({
      where: { formId: form.id, respondentId: user.id, deletedAt: null },
      select: { id: true },
    });

    const response = existing
      ? await prisma.formResponse.update({
          where: { id: existing.id },
          data: {
            answers: answersJson,
            status: ReviewStatus.SUBMITTED,
            submittedAt: new Date(),
            ...link,
          },
          select: { id: true },
        })
      : await prisma.formResponse.create({
          data: {
            formId: form.id,
            respondentId: user.id,
            answers: answersJson,
            status: ReviewStatus.SUBMITTED,
            submittedAt: new Date(),
            ...link,
          },
          select: { id: true },
        });

    await writeAuditLog({
      actorId: user.id,
      cohortId: participant.cohortId,
      action: existing ? 'review_response.updated' : 'review_response.submitted',
      entityType: 'FormResponse',
      entityId: response.id,
      metadata: {
        formId: form.id,
        type: input.type,
        roleName: participant.roleName,
        fieldCount: form.schema.fields.length,
      },
    });

    revalidatePath(REVIEW_PATH[input.type]);
    return ok({ responseId: response.id });
  } catch (error) {
    return mapActionError(error);
  }
}

// useActionState adapter (prevState, formData) → ActionResult.
export type ReviewFormState = ActionResult<{ responseId: string }> | null;

export async function submitReviewResponseForm(
  _prev: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  return submitReviewResponse(formData);
}

// ── AI Review Assistant (CLAUDE.md §9.4) ────────────────────────────────────
// Drafts a programme review report from the real cohort roll-up. Advisory: it
// returns an editable draft and never writes — a human persists the summary via
// saveReviewSummary. Reviewers (programme-wide reporting) and admins may run it.
const REPORT_ROLES = [...ADMIN_ROLES, RoleName.REVIEWER];

/** Pairs without a completed review of this type → "Mentor · Mentee" labels. */
function pairsMissing(
  pairs: Awaited<ReturnType<typeof getReviewRollup>>['pairs'],
  type: ReviewType,
): string[] {
  const incomplete = pairs.filter((p) =>
    type === ReviewType.MIDTERM
      ? !(p.mentorMidterm && p.menteeMidterm)
      : !(p.mentorFinal && p.menteeFinal),
  );
  return incomplete
    .slice(0, 20)
    .map((p) => `${p.mentorName ?? '—'} · ${p.menteeName ?? '—'}`);
}

const reportInputSchema = z.object({ type: z.nativeEnum(ReviewType) });

export type ReviewReportResult = { enabled: boolean; report: ReviewReport | null };

export async function requestReviewReport(input: {
  type: ReviewType;
}): Promise<ActionResult<ReviewReportResult>> {
  try {
    const user = await requireRole(REPORT_ROLES);
    const { type } = reportInputSchema.parse(input);

    const cohortId = await resolveReviewerCohortId();
    if (!cohortId) return fail({ code: 'NOT_FOUND', message: 'No active cohort.' });

    const adapter = getAiAdapter();
    if (!adapter.enabled) return ok({ enabled: false, report: null });

    const rollup = await getReviewRollup(cohortId);
    const summary: ReviewTypeSummary = type === ReviewType.MIDTERM ? rollup.midterm : rollup.final;
    const lang = user.locale === 'FR' ? 'FR' : 'EN';

    const prompt = buildReviewReportPrompt(
      {
        type: type === ReviewType.MIDTERM ? 'MIDTERM' : 'FINAL',
        eligible: summary.eligible,
        submitted: summary.submitted,
        percent: summary.percent,
        questionLines: summary.aggregates.map((a) => aggregateToLine(a, lang)),
        pairsMissing: pairsMissing(rollup.pairs, type),
      },
      lang,
    );

    const raw = await adapter.complete({ prompt, maxTokens: 700, temperature: 0.3 });
    return ok({ enabled: true, report: parseReviewReportResponse(raw) });
  } catch (error) {
    return mapActionError(error);
  }
}

const saveSummarySchema = z.object({
  type: z.nativeEnum(ReviewType),
  summary: z.string().trim().min(1, 'Write a summary before saving.').max(5000),
});

export async function saveReviewSummary(input: {
  type: ReviewType;
  summary: string;
}): Promise<ActionResult<{ saved: true }>> {
  try {
    const user = await requireRole(REPORT_ROLES);
    const { type, summary } = saveSummarySchema.parse(input);

    const cohortId = await resolveReviewerCohortId();
    if (!cohortId) return fail({ code: 'NOT_FOUND', message: 'No active cohort.' });

    const cycleId = await ensureReviewCycle(cohortId, type);
    if (type === ReviewType.MIDTERM) {
      await prisma.midtermReview.update({ where: { id: cycleId }, data: { aiSummary: summary } });
    } else {
      await prisma.finalReview.update({ where: { id: cycleId }, data: { aiSummary: summary } });
    }

    await writeAuditLog({
      actorId: user.id,
      cohortId,
      action: 'review_summary.saved',
      entityType: type === ReviewType.MIDTERM ? 'MidtermReview' : 'FinalReview',
      entityId: cycleId,
      metadata: { type, length: summary.length },
    });

    revalidatePath('/dashboard/reviewer');
    return ok({ saved: true });
  } catch (error) {
    return mapActionError(error);
  }
}
