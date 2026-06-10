import type { Metadata } from 'next';
import { Fraunces, Inter } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import './globals.css';

// Self-hosted fonts (§19 §2). next/font downloads and serves these from our own
// origin at build time — no runtime Google requests, so they work offline / on
// low-bandwidth plant connections. Fraunces = display/headings, Inter = body/UI.
// (If the production build runs air-gapped, swap to @fontsource-variable.)
const fraunces = Fraunces({
  subsets: ['latin'],
  weight: ['500'],
  style: ['normal'],
  variable: '--font-fraunces',
  display: 'swap',
});
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
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
    <html lang={locale} className={`${fraunces.variable} ${inter.variable}`} suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans text-body text-foreground antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
