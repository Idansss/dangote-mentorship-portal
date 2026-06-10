import { getTranslations } from 'next-intl/server';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ForgotPasswordForm } from './forgot-password-form';

export default async function ForgotPasswordPage() {
  const t = await getTranslations('auth');
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{t('forgotTitle')}</CardTitle>
        <CardDescription>{t('forgotSubtitle')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ForgotPasswordForm />
      </CardContent>
    </Card>
  );
}
