import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function NotFound() {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 text-center">
      <h2 className="text-3xl font-bold">404</h2>
      <p className="text-muted-foreground">{t('noData')}</p>
      <Button asChild>
        <Link href="/">{t('back')}</Link>
      </Button>
    </div>
  );
}
