import { getTranslations } from 'next-intl/server';
import { InviteStatus } from '@prisma/client';
import { prisma } from '@/lib/db/prisma';
import { hashInviteToken } from '@/lib/auth/invite';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { acceptInvite } from './actions';
import { InviteForm } from './invite-form';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations('auth');

  const invite = await prisma.invite.findUnique({ where: { tokenHash: hashInviteToken(token) } });
  const valid =
    invite &&
    !invite.deletedAt &&
    invite.status === InviteStatus.PENDING &&
    invite.expiresAt >= new Date();

  if (!valid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('inviteTitle')}</CardTitle>
          <CardDescription className="text-destructive">{t('inviteInvalid')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const boundAction = acceptInvite.bind(null, token);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('inviteTitle')}</CardTitle>
        <CardDescription>{t('inviteSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <InviteForm action={boundAction} email={invite.email} />
      </CardContent>
    </Card>
  );
}
