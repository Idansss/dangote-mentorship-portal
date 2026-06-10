import { getTranslations } from 'next-intl/server';
import { prisma } from '@/lib/db/prisma';
import { hashToken } from '@/lib/auth/token';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { resetPassword } from './actions';
import { ResetPasswordForm } from './reset-password-form';

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations('auth');

  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });
  const valid = record && !record.deletedAt && !record.usedAt && record.expiresAt >= new Date();

  if (!valid) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{t('resetTitle')}</CardTitle>
          <CardDescription className="text-destructive">{t('resetInvalid')}</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const boundAction = resetPassword.bind(null, token);

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('resetTitle')}</CardTitle>
        <CardDescription>{t('resetSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ResetPasswordForm action={boundAction} />
      </CardContent>
    </Card>
  );
}
