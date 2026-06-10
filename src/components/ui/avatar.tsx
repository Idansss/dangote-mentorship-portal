'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '@/lib/utils';

// Avatar + AvatarGroup (§19 §4). Round (pill radius), green-soft fallback with
// initials in green-strong. AvatarGroup overlaps members with a +N overflow.
const Avatar = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Root
    ref={ref}
    className={cn(
      'relative flex size-10 shrink-0 overflow-hidden rounded-full ring-2 ring-bg',
      className,
    )}
    {...props}
  />
));
Avatar.displayName = AvatarPrimitive.Root.displayName;

const AvatarImage = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Image>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Image>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Image ref={ref} className={cn('aspect-square size-full', className)} {...props} />
));
AvatarImage.displayName = AvatarPrimitive.Image.displayName;

const AvatarFallback = React.forwardRef<
  React.ComponentRef<typeof AvatarPrimitive.Fallback>,
  React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Fallback>
>(({ className, ...props }, ref) => (
  <AvatarPrimitive.Fallback
    ref={ref}
    className={cn(
      'flex size-full items-center justify-center rounded-full bg-green-soft text-small font-medium text-green-strong',
      className,
    )}
    {...props}
  />
));
AvatarFallback.displayName = AvatarPrimitive.Fallback.displayName;

interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Max avatars to show before collapsing into a +N chip. */
  max?: number;
}

function AvatarGroup({ className, children, max, ...props }: AvatarGroupProps) {
  const items = React.Children.toArray(children);
  const shown = typeof max === 'number' ? items.slice(0, max) : items;
  const overflow = items.length - shown.length;
  return (
    <div className={cn('flex items-center -space-x-3', className)} {...props}>
      {shown}
      {overflow > 0 && (
        <span className="relative flex size-10 items-center justify-center rounded-full bg-surface-2 text-small font-medium text-ink-2 ring-2 ring-bg">
          +{overflow}
        </span>
      )}
    </div>
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarGroup };
