import { getTranslations } from 'next-intl/server';

export default async function FaqPage() {
  const t = await getTranslations('faq');
  const items = [
    { q: t('q1'), a: t('a1') },
    { q: t('q2'), a: t('a2') },
  ];
  return (
    <section className="mx-auto max-w-3xl space-y-6">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <dl className="space-y-4">
        {items.map((item) => (
          <div key={item.q} className="rounded-lg border p-4">
            <dt className="font-medium">{item.q}</dt>
            <dd className="mt-1 text-muted-foreground">{item.a}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
