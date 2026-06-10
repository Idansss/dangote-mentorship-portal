import 'server-only';
import { AgreementType, MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';

export interface SignedAgreement {
  id: string;
  type: AgreementType;
  signedAt: Date | null;
  hasPdf: boolean;
}

export type AgreementContext =
  | { eligible: false }
  | {
      eligible: true;
      cohortId: string;
      role: 'mentor' | 'mentee';
      counterpartName: string | null;
      signed: SignedAgreement[];
    };

/**
 * Agreements become available once a pair is active (CLAUDE.md M2). Resolve the
 * current user's accepted pairing, the cohort it belongs to, and which agreements
 * they have already signed. Returns { eligible: false } when the user has no
 * accepted match yet.
 */
export async function getAgreementContext(userId: string): Promise<AgreementContext> {
  const match = await prisma.match.findFirst({
    where: {
      status: MatchStatus.ACCEPTED,
      deletedAt: null,
      OR: [{ mentorId: userId }, { menteeId: userId }],
    },
    orderBy: { acceptedAt: 'desc' },
    include: {
      mentor: { select: { id: true, name: true } },
      mentee: { select: { id: true, name: true } },
    },
  });

  if (!match) return { eligible: false };

  const role: 'mentor' | 'mentee' = match.mentorId === userId ? 'mentor' : 'mentee';
  const counterpartName = role === 'mentor' ? match.mentee.name : match.mentor.name;

  const signed = await prisma.agreement.findMany({
    where: { signedById: userId, cohortId: match.cohortId, deletedAt: null },
    select: { id: true, type: true, signedAt: true, pdfUrl: true },
    orderBy: { createdAt: 'asc' },
  });

  return {
    eligible: true,
    cohortId: match.cohortId,
    role,
    counterpartName,
    signed: signed.map((a) => ({
      id: a.id,
      type: a.type,
      signedAt: a.signedAt,
      hasPdf: Boolean(a.pdfUrl),
    })),
  };
}
