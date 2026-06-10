import { getTranslations } from 'next-intl/server';
import { GoalStage, RoleName } from '@prisma/client';
import { requireUser } from '@/lib/auth/rbac';
import { getMenteePairing, getMenteeGoals, getGoalsForMentor } from '@/features/goals/data';
import { getDraft } from '@/features/drafts/data';
import { GOAL_STAGE_ORDER } from '@/features/goals/stage';
import type { GoalDraftFields } from '@/features/goals/smart';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { GoalForm } from './goal-form';
import { GoalCard } from './goal-card';

export default async function GoalsPage() {
  const user = await requireUser();
  const t = await getTranslations('goals');

  const stageLabels = Object.fromEntries(
    GOAL_STAGE_ORDER.map((s) => [s, t(`stage.${s}`)]),
  ) as Record<GoalStage, string>;

  const isMentor = user.roles.includes(RoleName.MENTOR);
  const isMentee = user.roles.includes(RoleName.MENTEE);

  const [pairing, menteeGoals, mentorGroups] = await Promise.all([
    isMentee ? getMenteePairing(user.id) : Promise.resolve(null),
    isMentee ? getMenteeGoals(user.id) : Promise.resolve([]),
    isMentor ? getGoalsForMentor(user.id) : Promise.resolve([]),
  ]);

  const newGoalDraft =
    isMentee && pairing ? await getDraft<GoalDraftFields>(user.id, 'goal:new') : null;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">{t('title')}</h1>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {/* Mentee view */}
      {isMentee ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t('myGoals')}</h2>

          {!pairing ? (
            <p className="text-muted-foreground">{t('notEligible')}</p>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('newGoal')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <GoalForm
                    mode="create"
                    cohortId={pairing.cohortId}
                    initial={newGoalDraft ?? undefined}
                    enableDraft
                  />
                </CardContent>
              </Card>

              {menteeGoals.length === 0 ? (
                <p className="text-muted-foreground">{t('noGoalsMentee')}</p>
              ) : (
                <div className="space-y-4">
                  {menteeGoals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} viewer="mentee" stageLabels={stageLabels} />
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      ) : null}

      {/* Mentor view */}
      {isMentor ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold">{t('menteeGoals')}</h2>
          {mentorGroups.length === 0 ? (
            <p className="text-muted-foreground">{t('noPairings')}</p>
          ) : (
            mentorGroups.map((group) => (
              <div key={group.mentee.menteeId} className="space-y-3">
                <h3 className="font-medium">{group.mentee.menteeName}</h3>
                {group.goals.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('noGoalsMentor')}</p>
                ) : (
                  group.goals.map((goal) => (
                    <GoalCard key={goal.id} goal={goal} viewer="mentor" stageLabels={stageLabels} />
                  ))
                )}
              </div>
            ))
          )}
        </section>
      ) : null}

      {!isMentee && !isMentor ? <p className="text-muted-foreground">{t('noAccess')}</p> : null}
    </div>
  );
}
