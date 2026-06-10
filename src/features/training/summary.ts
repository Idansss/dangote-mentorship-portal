import { AttendanceStatus } from '@prisma/client';

// Pure trainer-dashboard roll-up (CLAUDE.md §12). No I/O / no server-only import,
// so it is unit-testable in isolation; the DB read lives in data.ts.

export interface BatchSummary {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  participants: number;
  attended: number;
  /** Attended ÷ registered, 0–100. */
  attendanceRate: number;
  materials: number;
  assessmentsPassed: number;
}

export interface TrainerTotals {
  batches: number;
  participants: number;
  attendanceRate: number;
}

export interface TrainerDashboard {
  batches: BatchSummary[];
  totals: TrainerTotals;
}

export interface RawBatch {
  id: string;
  name: string;
  startDate: Date | null;
  endDate: Date | null;
  attendance: { status: AttendanceStatus }[];
  assessments: { passed: boolean | null }[];
  materials: number;
}

/** Pure per-batch roll-up. */
export function summarizeBatch(b: RawBatch): BatchSummary {
  const participants = b.attendance.length;
  const attended = b.attendance.filter((a) => a.status === AttendanceStatus.ATTENDED).length;
  return {
    id: b.id,
    name: b.name,
    startDate: b.startDate,
    endDate: b.endDate,
    participants,
    attended,
    attendanceRate: participants > 0 ? Math.round((attended / participants) * 100) : 0,
    materials: b.materials,
    assessmentsPassed: b.assessments.filter((a) => a.passed === true).length,
  };
}

/** Pure cohort-level totals across batch summaries. */
export function computeTrainerTotals(summaries: BatchSummary[]): TrainerTotals {
  const participants = summaries.reduce((sum, b) => sum + b.participants, 0);
  const attended = summaries.reduce((sum, b) => sum + b.attended, 0);
  return {
    batches: summaries.length,
    participants,
    attendanceRate: participants > 0 ? Math.round((attended / participants) * 100) : 0,
  };
}
