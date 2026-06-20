import { Skeleton } from '@/components/ui/skeleton';

// Suspense fallback for the public/marketing area. It lives *inside* the (public)
// layout, so navigating to an async page keeps the SiteHeader and SiteFooter on
// screen and only the body shows a skeleton, instead of falling back to the root
// loading.tsx which would blank the whole frame to white (§19 §9). Public pages
// manage their own width, so this supplies its own container. Language-agnostic
// (§16: no hardcoded English).
export default function PublicLoading() {
  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-6 px-4 py-12 sm:px-6" aria-busy="true">
      <div className="space-y-3">
        <Skeleton className="h-10 w-3/4 max-w-xl" />
        <Skeleton className="h-5 w-full max-w-2xl" />
        <Skeleton className="h-5 w-2/3 max-w-lg" />
      </div>
      <Skeleton className="h-72 w-full" />
    </div>
  );
}
