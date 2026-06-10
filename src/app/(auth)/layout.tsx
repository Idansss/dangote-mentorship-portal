import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { LocaleSwitcher } from '@/components/locale-switcher';

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations('common');
  return (
    <div className="flex min-h-screen flex-col">
      <header className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-semibold text-primary">
          {t('appName')}
        </Link>
        <LocaleSwitcher />
      </header>
      <main className="container flex flex-1 items-center justify-center py-12">{children}</main>
    </div>
  );
}
