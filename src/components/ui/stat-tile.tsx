import * as React from 'react';
import { cn } from '@/lib/utils';

// StatTile (§19 §3/§8) — the admin "stat tiles row". A big tabular number under
// a micro eyebrow, optional status tone + delta hint. Numbers use Inter tabular
// figures so they don't jitter (§2).
const toneClass = {
  default: 'text-ink',
  ok: 'text-green-strong',
  warn: 'text-warn',
  risk: 'text-risk',
  info: 'text-info',
} as const;

export interface StatTileProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: React.ReactNode;
  hint?: string;
  icon?: React.ReactNode;
  tone?: keyof typeof toneClass;
}

// The icon chip tints to match the tile's status tone (soft fill + brand-ink
// pairing), echoing the PulseHR stat cards. Default tone uses the brand green.
const chipClass = {
  default: 'bg-green-soft text-green',
  ok: 'bg-green-soft text-green',
  warn: 'bg-warn/10 text-warn',
  risk: 'bg-risk/10 text-risk',
  info: 'bg-info/10 text-info',
} as const;

function StatTile({ label, value, hint, icon, tone = 'default', className, ...props }: StatTileProps) {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-card p-6 shadow-elevation transition-shadow duration-200 hover:shadow-elevation-lg motion-reduce:transition-none',
        className,
      )}
      {...props}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="text-micro uppercase text-ink-3">{label}</span>
        {icon && (
          <span
            className={cn(
              'flex size-10 shrink-0 items-center justify-center rounded-xl [&_svg]:size-5',
              chipClass[tone],
            )}
          >
            {icon}
          </span>
        )}
      </div>
      <div className={cn('mt-3 text-display tabular-nums', toneClass[tone])}>{value}</div>
      {hint && <div className="mt-1 text-small text-ink-2">{hint}</div>}
    </div>
  );
}

export { StatTile };
