import * as React from 'react';
import { cn } from '@/lib/utils';

// ProgressRing (§19 §4) — circular progress for health/journey % (the dashboard
// "programme health ring", per-goal rings). Pure SVG, no dependency. Track in
// surface-2, arc in green (or a status tone); centered label by default.
const toneStroke = {
  green: 'stroke-green',
  ok: 'stroke-ok',
  warn: 'stroke-warn',
  risk: 'stroke-risk',
} as const;

export interface ProgressRingProps extends React.HTMLAttributes<HTMLDivElement> {
  /** 0–100. */
  value: number;
  size?: number;
  strokeWidth?: number;
  tone?: keyof typeof toneStroke;
  /** Centered content; defaults to the rounded percentage. */
  label?: React.ReactNode;
  showLabel?: boolean;
}

function ProgressRing({
  value,
  size = 72,
  strokeWidth = 8,
  tone = 'green',
  label,
  showLabel = true,
  className,
  ...props
}: ProgressRingProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`${Math.round(clamped)}%`}
      {...props}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="fill-none stroke-surface-2"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn('fill-none transition-[stroke-dashoffset] duration-500', toneStroke[tone])}
        />
      </svg>
      {showLabel && (
        <span className="absolute text-h3 tabular-nums text-ink">
          {label ?? `${Math.round(clamped)}%`}
        </span>
      )}
    </div>
  );
}

export { ProgressRing };
