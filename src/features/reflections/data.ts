import 'server-only';
import { Language, MatchStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { getMentorPairings, type MentorPairing } from '@/lib/pairings';
import { canMentorSee } from './visibility';

// Reads for the private reflection journal + mentor private notes
// (experience-layer.md §1.16). Confidentiality posture mirrors DMs: content is
// private to its owner; admins and the risk monitor never see bodies here. The
// only cross-party visibility is a reflection the mentee has *explicitly* shared
// with their mentor.

export interface ReflectionEntryView {
  id: string;
  title: string | null;
  body: string;
  bodyLang: Language;
  isSharedWithMentor: boolean;
  sessionLogId: string | null;
  sessionDate: Date | null;
  authorName: string | null;
  createdAt: Date;
}

export interface MentorNoteView {
  id: string;
  kind: string | null;
  body: string;
  bodyLang: Language;
  createdAt: Date;
}

export interface SessionLogOption {
  id: string;
  date: Date | null;
  competencyDiscussed: string | null;
}

/** The mentee's own cohort (from their profile), so journaling works pre-match. */
export async function getMenteeCohortId(userId: string): Promise<string | null> {
  const profile = await prisma.menteeProfile.findFirst({
    where: { userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    select: { cohortId: true },
  });
  return profile?.cohortId ?? null;
}

/** The signed-in mentee's own reflection entries, newest first. */
export async function getMyReflections(userId: string): Promise<ReflectionEntryView[]> {
  const entries = await prisma.reflectionJournalEntry.findMany({
    where: { authorId: userId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
    include: { author: { select: { name: true } }, sessionLog: { select: { date: true } } },
  });
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.body,
    bodyLang: e.bodyLang,
    isSharedWithMentor: e.isSharedWithMentor,
    sessionLogId: e.sessionLogId,
    sessionDate: e.sessionLog?.date ?? null,
    authorName: e.author.name,
    createdAt: e.createdAt,
  }));
}

/** Recent session logs a mentee can optionally attach a reflection to. */
export async function getMenteeLogOptions(userId: string): Promise<SessionLogOption[]> {
  const logs = await prisma.sessionLog.findMany({
    where: { menteeId: userId, deletedAt: null },
    orderBy: { date: 'desc' },
    take: 20,
    select: { id: true, date: true, competencyDiscussed: true },
  });
  return logs;
}

/**
 * Reflections mentees have explicitly shared with this mentor. Scoped to the
 * mentor's accepted pairings — a mentor only ever sees their own mentees' shared
 * entries, and only the ones flagged shared.
 */
export async function getSharedReflections(mentorId: string): Promise<ReflectionEntryView[]> {
  const pairings = await prisma.match.findMany({
    where: { mentorId, status: MatchStatus.ACCEPTED, deletedAt: null },
    select: { menteeId: true },
  });
  const menteeIds = pairings.map((p) => p.menteeId);
  if (menteeIds.length === 0) return [];

  const rows = await prisma.reflectionJournalEntry.findMany({
    where: { authorId: { in: menteeIds }, isSharedWithMentor: true, deletedAt: null },
    orderBy: { sharedAt: 'desc' },
    include: { author: { select: { name: true } }, sessionLog: { select: { date: true } } },
  });
  // Defense in depth: re-apply the pure sharing rule on top of the query filter.
  const entries = rows.filter((e) => canMentorSee(e, menteeIds));
  return entries.map((e) => ({
    id: e.id,
    title: e.title,
    body: e.body,
    bodyLang: e.bodyLang,
    isSharedWithMentor: e.isSharedWithMentor,
    sessionLogId: e.sessionLogId,
    sessionDate: e.sessionLog?.date ?? null,
    authorName: e.author.name,
    createdAt: e.createdAt,
  }));
}

export type MentorNoteGroup = { mentee: MentorPairing; notes: MentorNoteView[] };

/** A mentor's private notes, grouped per paired mentee. Mentor-only. */
export async function getMentorNoteGroups(mentorId: string): Promise<MentorNoteGroup[]> {
  const pairings = await getMentorPairings(mentorId);
  if (pairings.length === 0) return [];

  const notes = await prisma.mentorPrivateNote.findMany({
    where: { mentorId, deletedAt: null },
    orderBy: { createdAt: 'desc' },
  });

  return pairings.map((mentee) => ({
    mentee,
    notes: notes
      .filter((n) => n.menteeId === mentee.menteeId)
      .map((n) => ({ id: n.id, kind: n.kind, body: n.body, bodyLang: n.bodyLang, createdAt: n.createdAt })),
  }));
}
