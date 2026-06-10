import { SupportRequestStatus, type SupportRequestReason } from '@prisma/client';

// Pure, server-only-free view type + helpers for the support queue
// (experience-layer.md §1.13), so they can be unit-tested without pulling in the
// data layer. The data module re-exports these.

export interface SupportRequestView {
  id: string;
  reason: SupportRequestReason;
  message: string | null;
  status: SupportRequestStatus;
  adminResponse: string | null;
  requesterName: string | null;
  requesterEmail: string;
  cohortName: string | null;
  handledByName: string | null;
  createdAt: Date;
  resolvedAt: Date | null;
}

export function countOpen(requests: SupportRequestView[]): number {
  return requests.filter((r) => r.status === SupportRequestStatus.OPEN).length;
}
