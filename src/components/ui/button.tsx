import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Button (§19 §4): primary green / secondary outline / ghost / destructive.
// 44px min touch target, visible green focus ring, sentence case, reduced-motion
// safe (color transition only). Radius 8px (rounded-md → control radius).
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green/30 focus-visible:ring-offset-2 focus-visible:ring-offset-bg disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-green text-white hover:bg-green-strong',
        secondary: 'border border-border bg-bg text-ink hover:bg-surface',
        outline: 'border border-border bg-bg text-ink hover:bg-surface',
        ghost: 'text-ink hover:bg-surface-2',
        destructive: 'bg-risk text-white hover:bg-risk/90',
        link: 'text-green underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 text-body', // 44px touch target (§4)
        sm: 'h-9 px-3 text-small',
        lg: 'h-12 px-7 text-h3',
        icon: 'h-11 w-11',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
