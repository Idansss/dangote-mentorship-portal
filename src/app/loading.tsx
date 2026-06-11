import { Skeleton } from '@/components/ui/skeleton';

// Root Suspense fallback (§19 §9: "skeleton loaders not spinners"). A neutral
// page-shaped skeleton — a title, a stat-tile row, and a content block — so
// navigation reads as the page assembling rather than a blank "Loading…".
// Language-agnostic, so French users never see hardcoded English (§16).
export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-4 py-8 sm:px-6" aria-busy="true">
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
