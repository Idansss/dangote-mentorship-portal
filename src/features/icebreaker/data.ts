import 'server-only';
import { MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { pairAccessFromMatch, type PairRole } from '@/features/pair/access';
import type { IcebreakerContext, IcebreakerResult } from './icebreaker';

// I/O for the first-session icebreaker (experience-layer.md §1.17). Resolves the
// accepted pair (authorizing via the pure pairAccessFromMatch rule), assembles
// the two-profile context, and exposes the per-pair cache on the Match row.

export interface IcebreakerView {
  match: { id: string; cohortId: string; mentorId: string; menteeId: string };
  role: PairRole;
  context: IcebreakerContext;
  cached: IcebreakerResult | null;
  generatedAt: Date | null;
}

type CompetencyLink = { competency: { name: string }; isToStrengthen: boolean };

function names(links: CompetencyLink[], onlyToStrengthen = false): string[] {
  return links
    .filter((l) => (onlyToStrengthen ? l.isToStrengthen : true))
    .map((l) => l.competency.name);
}

/**
 * Load the icebreaker view for the pair identified by menteeId, as seen by
 * viewerId, or null when the viewer is not in that accepted pair. The guide is
 * the same for both participants (it is the pair's shared first-meeting guide).
 */
export async function getIcebreaker(
  viewerId: string,
  menteeId: string,
): Promise<IcebreakerView | null> {
  const match = await prisma.match.findFirst({
    where: { menteeId, status: MatchStatus.ACCEPTED, deletedAt: null },
    orderBy: { acceptedAt: 'desc' },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });

  const role = pairAccessFromMatch(match, viewerId);
  if (!match || !role) return null;

  const mentorId = match.mentor.id;
  const { cohortId } = match;

  const [mentorProfile, menteeProfile] = await Promise.all([
    prisma.mentorProfile.findFirst({
      where: { userId: mentorId, cohortId, deletedAt: null },
      select: {
        interests: true,
        whatCanLearn: true,
        competencies: {
          where: { deletedAt: null },
          select: { isToStrengthen: true, competency: { select: { name: true } } },
        },
      },
    }),
    prisma.menteeProfile.findFirst({
      where: { userId: menteeId, cohortId, deletedAt: null },
      select: {
        interests: true,
        careerGoals: true,
        whyMentor: true,
        competencies: {
          where: { deletedAt: null },
          select: { isToStrengthen: true, competency: { select: { name: true } } },
        },
      },
    }),
  ]);

  const context: IcebreakerContext = {
    mentorName: match.mentor.name,
    menteeName: match.mentee.name,
    mentorInterests: mentorProfile?.interests ?? null,
    menteeInterests: menteeProfile?.interests ?? null,
    mentorWhatCanLearn: mentorProfile?.whatCanLearn ?? null,
    mentorCompetencies: mentorProfile ? names(mentorProfile.competencies) : [],
    menteeCareerGoals: menteeProfile?.careerGoals ?? null,
    menteeWhyMentor: menteeProfile?.whyMentor ?? null,
    menteeCompetencies: menteeProfile ? names(menteeProfile.competencies, true) : [],
  };

  return {
    match: { id: match.id, cohortId, mentorId, menteeId },
    role,
    context,
    cached: (match.icebreakerJson as IcebreakerResult | null) ?? null,
    generatedAt: match.icebreakerGeneratedAt,
  };
}
