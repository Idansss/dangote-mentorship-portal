'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { SupportRequestReason, SupportRequestStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { requireUser, hasAnyRole } from '@/lib/auth/rbac';
import { ADMIN_ROLES } from '@/lib/auth/roles';
import { writeAuditLog } from '@/lib/audit/audit';
import { notify, notifyMany } from '@/lib/notifications/notify';
import { mapActionError, ok, fail, type ActionResult } from '@/lib/actions/result';
import { getRequesterCohortId, getAdminUserIds } from './data';

// Private support requests (experience-layer.md §1.13). Any participant can raise
// one from their dashboard; it routes to the admin queue. Requester identity is
// always recorded for the programme team — "anonymous" means hidden from other
// participants, not from admins. Fully audited.

function emptyToNull(value: string | undefined | null): string | null {
  return value && value.trim() ? value.trim() : null;
}

// ── Submit (any authenticated participant) ──────────────────────────────────

const submitSchema = z.object({
  reason: z.nativeEnum(SupportRequestReason),
  message: z.string().trim().max(4000).optional().or(z.literal('')),
});

export async function submitSupportRequest(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    const data = submitSchema.parse({
      reason: formData.get('reason'),
      message: formData.get('message') ?? '',
    });

    const cohortId = await getRequesterCohortId(user.id);
    if (!cohortId) {
      return fail({ code: 'FORBIDDEN', message: 'You are not part of an active cohort yet.' });
    }

    const request = await prisma.supportRequest.create({
      data: {
        cohortId,
        requesterId: user.id,
        reason: data.reason,
        message: emptyToNull(data.message),
        status: SupportRequestStatus.OPEN,
      },
    });
    // Audit carries the reason/status only — never the free-text message body.
    await writeAuditLog({
      actorId: user.id,
      cohortId,
      action: 'support_request.created',
      entityType: 'SupportRequest',
      entityId: request.id,
      metadata: { reason: data.reason },
    });

    // Alert the programme team that a request is waiting (§1.10).
    const adminIds = await getAdminUserIds();
    await notifyMany(adminIds, {
      type: 'support_received',
      params: { reason: data.reason },
      link: '/admin/support',
      cohortId,
    });

    revalidatePath('/support');
    revalidatePath('/admin/support');
    return ok({ id: request.id });
  } catch (error) {
    return mapActionError(error);
  }
}

// ── Respond (admins only) ───────────────────────────────────────────────────

const respondSchema = z.object({
  requestId: z.string().cuid(),
  status: z.nativeEnum(SupportRequestStatus),
  adminResponse: z.string().trim().max(4000).optional().or(z.literal('')),
});

export async function respondToSupportRequest(
  formData: FormData,
): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requireUser();
    if (!hasAnyRole(user, ADMIN_ROLES)) {
      return fail({ code: 'FORBIDDEN', message: 'Only the programme team can handle support requests.' });
    }
    const data = respondSchema.parse({
      requestId: formData.get('requestId'),
      status: formData.get('status'),
      adminResponse: formData.get('adminResponse') ?? '',
    });

    const request = await prisma.supportRequest.findUnique({ where: { id: data.requestId } });
    if (!request || request.deletedAt) {
      return fail({ code: 'NOT_FOUND', message: 'Support request not found.' });
    }

    const resolving = data.status === SupportRequestStatus.RESOLVED;
    await prisma.supportRequest.update({
      where: { id: request.id },
      data: {
        status: data.status,
        adminResponse: emptyToNull(data.adminResponse) ?? request.adminResponse,
        handledById: user.id,
        resolvedAt: resolving ? (request.resolvedAt ?? new Date()) : null,
      },
    });
    await writeAuditLog({
      actorId: user.id,
      cohortId: request.cohortId,
      action: 'support_request.updated',
      entityType: 'SupportRequest',
      entityId: request.id,
      metadata: { status: data.status },
    });

    // Let the requester know the team responded (§1.10).
    await notify({
      userId: request.requesterId,
      type: 'support_responded',
      link: '/support',
      cohortId: request.cohortId,
    });

    revalidatePath('/admin/support');
    revalidatePath('/support');
    return ok({ id: request.id });
  } catch (error) {
    return mapActionError(error);
  }
}

// ── useActionState wrappers ─────────────────────────────────────────────────

export type SupportActionState = ActionResult<{ id: string }> | null;

export async function submitSupportRequestForm(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  return submitSupportRequest(formData);
}
export async function respondToSupportRequestForm(
  _prev: SupportActionState,
  formData: FormData,
): Promise<SupportActionState> {
  return respondToSupportRequest(formData);
}
