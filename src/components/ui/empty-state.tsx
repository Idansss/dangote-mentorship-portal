import * as React from 'react';
import { cn } from '@/lib/utils';

// EmptyState (§19 §3) — "friendly empty states everywhere: a one-line plain
// prompt + the action that fills it. Never a blank panel." Centered icon in a
// green-soft disc, a title, an optional line, and an optional action slot.
export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

function EmptyState({ icon, title, description, action, className, ...props }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-surface px-6 py-12 text-center',
        className,
      )}
      {...props}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-green-soft text-green-strong">
          {icon}
        </div>
      )}
      <div className="space-y-1">
        <p className="text-h3 text-ink">{title}</p>
        {description && <p className="mx-auto max-w-sm text-small text-ink-2">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export { EmptyState };
