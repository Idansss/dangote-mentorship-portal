import { cn } from '@/lib/utils';

// SkeletonLoader (§19 §9): "skeleton loaders not spinners." A surface-2 block
// with a subtle pulse; reduced-motion users get a static placeholder
// (motion-reduce:animate-none).
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-md bg-surface-2 motion-reduce:animate-none', className)}
      {...props}
    />
  );
}

export { Skeleton };
