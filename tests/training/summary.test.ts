import { describe, expect, it } from 'vitest';
import { AttendanceStatus } from '@prisma/client';
import { summarizeBatch, computeTrainerTotals, type RawBatch } from '@/features/training/summary';

// Smoke/unit coverage for the trainer dashboard's pure roll-up (CLAUDE.md §12).

function raw(overrides: Partial<RawBatch> = {}): RawBatch {
  return {
    id: 'b1',
    name: 'Batch A',
    startDate: null,
    endDate: null,
    attendance: [],
    assessments: [],
    materials: 0,
    ...overrides,
  };
}

describe('summarizeBatch', () => {
  it('computes attendance rate, attended, and passed counts', () => {
    const s = summarizeBatch(
      raw({
        attendance: [
          { status: AttendanceStatus.ATTENDED },
          { status: AttendanceStatus.ATTENDED },
          { status: AttendanceStatus.ABSENT },
          { status: AttendanceStatus.REGISTERED },
        ],
        assessments: [{ passed: true }, { passed: false }, { passed: null }],
        materials: 2,
      }),
    );
    expect(s.participants).toBe(4);
    expect(s.attended).toBe(2);
    expect(s.attendanceRate).toBe(50);
    expect(s.assessmentsPassed).toBe(1);
    expect(s.materials).toBe(2);
  });

  it('reports a 0% rate for an empty batch (no divide-by-zero)', () => {
    expect(summarizeBatch(raw()).attendanceRate).toBe(0);
  });
});

describe('computeTrainerTotals', () => {
  it('aggregates participants and a weighted attendance rate across batches', () => {
    const totals = computeTrainerTotals([
      summarizeBatch(raw({ attendance: [{ status: AttendanceStatus.ATTENDED }, { status: AttendanceStatus.ABSENT }] })),
      summarizeBatch(raw({ id: 'b2', attendance: [{ status: AttendanceStatus.ATTENDED }, { status: AttendanceStatus.ATTENDED }] })),
    ]);
    expect(totals.batches).toBe(2);
    expect(totals.participants).toBe(4);
    expect(totals.attendanceRate).toBe(75); // 3 attended of 4
  });

  it('handles no batches', () => {
    expect(computeTrainerTotals([])).toEqual({ batches: 0, participants: 0, attendanceRate: 0 });
  });
});
