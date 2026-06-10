import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

// FloatingActionButton (§19 §4, §1.9 quick actions) — fixed bottom-right, large
// touch target (56px), green with the soft elevation and green focus ring. Use
// `asChild` to wrap a menu/drawer trigger.
export interface FabProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const Fab = React.forwardRef<HTMLButtonElement, FabProps>(
  ({ className, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(
          'fixed bottom-6 right-6 z-40 inline-flex size-14 items-center justify-center rounded-full bg-green text-white shadow-elevation transition-colors hover:bg-green-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg [&_svg]:size-6',
          className,
        )}
        {...props}
      />
    );
  },
);
Fab.displayName = 'Fab';

export { Fab };
