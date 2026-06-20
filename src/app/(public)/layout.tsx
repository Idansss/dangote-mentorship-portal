import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      {/* No container here — pages manage their own width so the marketing home
          can run full-bleed sections (Stitch redesign). Inner pages add their
          own container padding. */}
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}
