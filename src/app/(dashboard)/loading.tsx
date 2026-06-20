import { Skeleton } from '@/components/ui/skeleton';

// Suspense fallback for the authenticated area. It lives *inside* the (dashboard)
// layout, so navigating to an async page (e.g. Notifications) keeps the AppShell
// — sidebar + top bar — on screen and only swaps the content region for a
// skeleton, instead of falling back to the root loading.tsx which would blank the
// whole shell to white (§19 §9: skeletons, not blank pages). The <main> wrapper
// already supplies the max-width and padding, so this is content-only and
// language-agnostic (§16: no hardcoded English).
export default function DashboardLoading() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="space-y-2">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
      <Skeleton className="h-64 w-full" />
    </div>
  );
}
