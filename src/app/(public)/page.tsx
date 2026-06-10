import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { Button } from '@/components/ui/button';

export default async function HomePage() {
  const t = await getTranslations('home');

  return (
    <section className="mx-auto max-w-3xl space-y-6 text-center">
      <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">{t('title')}</h1>
      <p className="text-lg text-muted-foreground">{t('subtitle')}</p>
      <div className="flex justify-center gap-3">
        <Button asChild size="lg">
          <Link href="/login">{t('cta')}</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/about">{t('aboutCta')}</Link>
        </Button>
      </div>
    </section>
  );
}
