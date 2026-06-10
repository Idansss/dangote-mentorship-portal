import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/rbac';
import { SiteHeader } from '@/components/site-header';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: middleware already gates this group, but never trust the
  // edge alone (CLAUDE.md §3).
  const user = await getCurrentUser();
  if (!user) redirect('/login');

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="container flex-1 py-10">{children}</main>
    </div>
  );
}
