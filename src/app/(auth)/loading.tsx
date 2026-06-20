import { Skeleton } from '@/components/ui/skeleton';

// Suspense fallback for the auth area. It lives *inside* the (auth) layout, so
// navigating to an async page (e.g. invite/reset token lookups) keeps the calm
// centered frame and ambient glow on screen and only the card shows a skeleton,
// instead of falling back to the root loading.tsx which would blank everything to
// white (§19 §9). The layout already centers and caps width at 440px, so this is
// card-shaped and language-agnostic (§16).
export default function AuthLoading() {
  return (
    <div className="space-y-4" aria-busy="true">
      <div className="flex flex-col items-center gap-3">
        <Skeleton className="size-12 rounded-full" />
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}
