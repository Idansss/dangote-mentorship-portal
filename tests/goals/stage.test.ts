import { describe, expect, it } from 'vitest';
import { GoalStage, GoalStatus } from '@prisma/client';
import {
  GOAL_STAGE_ORDER,
  menteeAdvanceTransition,
  reviewTransition,
  stageProgressPercent,
} from '@/features/goals/stage';

describe('stageProgressPercent', () => {
  it('runs 0 → 100 across the ordered stages', () => {
    expect(stageProgressPercent(GoalStage.DRAFTED)).toBe(0);
    expect(stageProgressPercent(GoalStage.ACHIEVED)).toBe(100);
    // Monotonically non-decreasing along the order.
    const values = GOAL_STAGE_ORDER.map(stageProgressPercent);
    for (let i = 1; i < values.length; i++) {
      expect(values[i]!).toBeGreaterThan(values[i - 1]!);
    }
  });
});

describe('reviewTransition', () => {
  it('only acts on submitted goals', () => {
    expect(
      reviewTransition({ status: GoalStatus.DRAFT, stage: GoalStage.DRAFTED }, 'approve'),
    ).toBeNull();
    expect(
      reviewTransition({ status: GoalStatus.APPROVED, stage: GoalStage.APPROVED }, 'reject'),
    ).toBeNull();
  });

  it('approve moves status+stage to APPROVED', () => {
    const next = reviewTransition(
      { status: GoalStatus.SUBMITTED, stage: GoalStage.DRAFTED },
      'approve',
    );
    expect(next).toEqual({ status: GoalStatus.APPROVED, stage: GoalStage.APPROVED });
  });

  it('comment marks mentor-reviewed but keeps it submitted', () => {
    const next = reviewTransition(
      { status: GoalStatus.SUBMITTED, stage: GoalStage.DRAFTED },
      'comment',
    );
    expect(next).toEqual({ status: GoalStatus.SUBMITTED, stage: GoalStage.MENTOR_REVIEWED });
  });

  it('reject rolls the stage back to drafted', () => {
    const next = reviewTransition(
      { status: GoalStatus.SUBMITTED, stage: GoalStage.MENTOR_REVIEWED },
      'reject',
    );
    expect(next).toEqual({ status: GoalStatus.REJECTED, stage: GoalStage.DRAFTED });
  });
});

describe('menteeAdvanceTransition', () => {
  it('refuses to advance a goal that is not approved', () => {
    expect(
      menteeAdvanceTransition(
        { status: GoalStatus.SUBMITTED, stage: GoalStage.DRAFTED },
        GoalStage.IN_PROGRESS,
      ),
    ).toBeNull();
  });

  it('refuses to jump back across the approval gate (e.g. to DRAFTED)', () => {
    expect(
      menteeAdvanceTransition(
        { status: GoalStatus.APPROVED, stage: GoalStage.IN_PROGRESS },
        GoalStage.DRAFTED,
      ),
    ).toBeNull();
  });

  it('refuses to move backward through working stages', () => {
    expect(
      menteeAdvanceTransition(
        { status: GoalStatus.APPROVED, stage: GoalStage.EVIDENCE_SUBMITTED },
        GoalStage.IN_PROGRESS,
      ),
    ).toBeNull();
  });

  it('advances APPROVED → IN_PROGRESS keeping status APPROVED', () => {
    expect(
      menteeAdvanceTransition(
        { status: GoalStatus.APPROVED, stage: GoalStage.APPROVED },
        GoalStage.IN_PROGRESS,
      ),
    ).toEqual({ status: GoalStatus.APPROVED, stage: GoalStage.IN_PROGRESS });
  });

  it('reaching ACHIEVED completes the goal', () => {
    expect(
      menteeAdvanceTransition(
        { status: GoalStatus.APPROVED, stage: GoalStage.EVIDENCE_SUBMITTED },
        GoalStage.ACHIEVED,
      ),
    ).toEqual({ status: GoalStatus.COMPLETED, stage: GoalStage.ACHIEVED });
  });
});
