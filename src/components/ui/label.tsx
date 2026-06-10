'use client';

import * as React from 'react';
import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

// Label (§19 §2): Small secondary-ink by default; `eyebrow` = Micro uppercase
// tracking used for section eyebrows and stat-tile captions.
const labelVariants = cva('leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', {
  variants: {
    variant: {
      default: 'text-small font-medium text-ink-2',
      eyebrow: 'text-micro uppercase text-ink-3',
    },
  },
  defaultVariants: { variant: 'default' },
});

const Label = React.forwardRef<
  React.ComponentRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, variant, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants({ variant }), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
