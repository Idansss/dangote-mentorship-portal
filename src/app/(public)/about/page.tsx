import { getTranslations } from 'next-intl/server';

export default async function AboutPage() {
  const t = await getTranslations('about');
  return (
    <article className="prose mx-auto max-w-3xl">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-4 text-muted-foreground">{t('body')}</p>
    </article>
  );
}
