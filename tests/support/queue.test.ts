import { describe, expect, it } from 'vitest';
import { SupportRequestReason, SupportRequestStatus } from '@prisma/client';
import { countOpen, type SupportRequestView } from '@/features/support/queue';

function req(status: SupportRequestStatus): SupportRequestView {
  return {
    id: Math.random().toString(36).slice(2),
    reason: SupportRequestReason.OTHER,
    message: null,
    status,
    adminResponse: null,
    requesterName: 'A',
    requesterEmail: 'a@example.com',
    cohortName: 'Demo',
    handledByName: null,
    createdAt: new Date(),
    resolvedAt: null,
  };
}

describe('countOpen', () => {
  it('counts only OPEN requests', () => {
    const queue = [
      req(SupportRequestStatus.OPEN),
      req(SupportRequestStatus.OPEN),
      req(SupportRequestStatus.IN_PROGRESS),
      req(SupportRequestStatus.RESOLVED),
    ];
    expect(countOpen(queue)).toBe(2);
  });

  it('is zero for an empty queue', () => {
    expect(countOpen([])).toBe(0);
  });
});
