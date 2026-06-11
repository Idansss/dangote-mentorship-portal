import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

// Self-hosted font (§19 §2). next/font downloads and serves Inter from our own
// origin at build time — no runtime Google requests, so it works offline / on
// low-bandwidth plant connections. We run a single grotesque (Inter) for the
// whole UI — Atlas-style: heavy weights (700/800) for headings, regular for
// body/UI/data — so `--font-inter` powers both the display and sans families.
// (If the production build runs air-gapped, swap to @fontsource-variable.)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Dangote Mentorship Portal',
  description: 'An intelligent, bilingual mentorship operating system for Dangote Group.',
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-body text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
