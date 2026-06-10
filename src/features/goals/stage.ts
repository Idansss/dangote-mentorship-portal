import { GoalStage, GoalStatus } from '@prisma/client';

// Pure goal-stage logic (experience-layer.md §1.7). No I/O — fully unit-tested.
//
// Two axes describe a goal and must stay coherent:
//   • GoalStatus  — the approval workflow (CLAUDE.md §7): DRAFT → SUBMITTED →
//     APPROVED / REJECTED → COMPLETED.
//   • GoalStage   — the progress visualization shown to the pair (§1.7):
//     Drafted → Mentor reviewed → Approved → In progress → Evidence submitted →
//     Achieved.
//
// This module owns the ordering and the legal transitions so the actions layer
// (which does the I/O and authz) only has to ask "is this move allowed, and
// what does it imply for status?".

export const GOAL_STAGE_ORDER: GoalStage[] = [
  GoalStage.DRAFTED,
  GoalStage.MENTOR_REVIEWED,
  GoalStage.APPROVED,
  GoalStage.IN_PROGRESS,
  GoalStage.EVIDENCE_SUBMITTED,
  GoalStage.ACHIEVED,
];

/** Stages the mentee drives themselves, once the goal is approved. */
export const MENTEE_WORKING_STAGES: GoalStage[] = [
  GoalStage.IN_PROGRESS,
  GoalStage.EVIDENCE_SUBMITTED,
  GoalStage.ACHIEVED,
];

export function stageIndex(stage: GoalStage): number {
  return GOAL_STAGE_ORDER.indexOf(stage);
}

/** 0–100 fill for the per-goal progress bar (§1.7). */
export function stageProgressPercent(stage: GoalStage): number {
  const i = stageIndex(stage);
  if (i <= 0) return 0;
  return Math.round((i / (GOAL_STAGE_ORDER.length - 1)) * 100);
}

export type ReviewDecision = 'comment' | 'approve' | 'reject';

export interface GoalState {
  status: GoalStatus;
  stage: GoalStage;
}

/**
 * Resolve the goal state after a mentor review action. Pure: callers persist the
 * result and write the audit row. A goal must be SUBMITTED to be acted on.
 *   - comment  → records feedback, marks "mentor reviewed", still awaiting decision
 *   - approve  → APPROVED + stage APPROVED (the working phase can begin)
 *   - reject   → REJECTED, stage rolled back to DRAFTED for the mentee to revise
 */
export function reviewTransition(current: GoalState, decision: ReviewDecision): GoalState | null {
  if (current.status !== GoalStatus.SUBMITTED) return null;
  switch (decision) {
    case 'comment':
      return { status: GoalStatus.SUBMITTED, stage: GoalStage.MENTOR_REVIEWED };
    case 'approve':
      return { status: GoalStatus.APPROVED, stage: GoalStage.APPROVED };
    case 'reject':
      return { status: GoalStatus.REJECTED, stage: GoalStage.DRAFTED };
    default:
      return null;
  }
}

/**
 * Validate a mentee-driven stage advance and resolve the implied status. The
 * mentee may only move an APPROVED goal forward through the working stages, and
 * only forward (or restate the current stage) — never backward, never past the
 * approval gate. Reaching ACHIEVED also completes the goal.
 */
export function menteeAdvanceTransition(
  current: GoalState,
  target: GoalStage,
): GoalState | null {
  const advanceable = current.status === GoalStatus.APPROVED || current.status === GoalStatus.COMPLETED;
  if (!advanceable) return null;
  if (!MENTEE_WORKING_STAGES.includes(target)) return null;
  // No moving backward below where the goal already is.
  if (stageIndex(target) < stageIndex(current.stage)) return null;

  const status = target === GoalStage.ACHIEVED ? GoalStatus.COMPLETED : GoalStatus.APPROVED;
  return { status, stage: target };
}
