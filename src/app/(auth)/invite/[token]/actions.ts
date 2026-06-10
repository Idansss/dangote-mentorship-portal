'use server';

import { z } from 'zod';
import { AuthError } from 'next-auth';
import { InviteStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { signIn } from '@/lib/auth/auth';
import { hashPassword } from '@/lib/auth/password';
import { hashInviteToken } from '@/lib/auth/invite';
import { writeAuditLog } from '@/lib/audit/audit';

const acceptSchema = z.object({
  name: z.string().min(1).max(120),
  password: z.string().min(8).max(200),
});

export type AcceptInviteState = { error?: 'invalid' | 'validation' };

// Public invite acceptance (CLAUDE.md §2: invite links). Activates an
// admin-created account: sets a password, grants the invited role, and links
// the role grant to the invite's cohort.
export async function acceptInvite(
  token: string,
  _prev: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const parsed = acceptSchema.safeParse({
    name: formData.get('name'),
    password: formData.get('password'),
  });
  if (!parsed.success) return { error: 'validation' };

  const tokenHash = hashInviteToken(token);
  const invite = await prisma.invite.findUnique({ where: { tokenHash } });

  if (
    !invite ||
    invite.deletedAt ||
    invite.status !== InviteStatus.PENDING ||
    invite.expiresAt < new Date()
  ) {
    return { error: 'invalid' };
  }

  const email = invite.email.toLowerCase();
  const passwordHash = await hashPassword(parsed.data.password);

  await prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { email },
      update: { name: parsed.data.name, passwordHash, isActive: true, emailVerified: new Date() },
      create: { email, name: parsed.data.name, passwordHash, emailVerified: new Date() },
    });

    const role = await tx.role.findUniqueOrThrow({ where: { name: invite.roleName } });
    // cohortId is nullable, so the compound unique can't be used for upsert here.
    const existingGrant = await tx.userRole.findFirst({
      where: { userId: user.id, roleId: role.id, cohortId: invite.cohortId },
    });
    if (existingGrant) {
      await tx.userRole.update({ where: { id: existingGrant.id }, data: { deletedAt: null } });
    } else {
      await tx.userRole.create({
        data: { userId: user.id, roleId: role.id, cohortId: invite.cohortId },
      });
    }

    await tx.invite.update({
      where: { id: invite.id },
      data: { status: InviteStatus.ACCEPTED, acceptedByUserId: user.id, acceptedAt: new Date() },
    });

    await writeAuditLog({
      actorId: user.id,
      cohortId: invite.cohortId,
      action: 'invite.accepted',
      entityType: 'Invite',
      entityId: invite.id,
      metadata: { roleName: invite.roleName },
    });
  });

  try {
    await signIn('credentials', { email, password: parsed.data.password, redirectTo: '/dashboard' });
    return {};
  } catch (error) {
    if (error instanceof AuthError) return { error: 'invalid' };
    throw error;
  }
}
