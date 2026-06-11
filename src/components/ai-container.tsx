import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

// AI output container (§19 §7) — one consistent visual language for AI as a
// native citizen: a green spark, a soft green-tinted container, and an
// always-editable result the human confirms. Use this to wrap every AI surface
// (session summary, meeting prep, goal coach) so a suggestion always reads as a
// draft. (Tinted green to match the site scheme — was --info blue through Step
// 9; the green-soft fill still sets it apart from plain committed cards.)
interface AIContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Header label; defaults to a generic "AI suggestion". */
  title?: string;
  /** Quiet reminder that the output is editable before saving. */
  hint?: string;
  /** Actions row (e.g. Use suggestion / Edit / Regenerate). */
  actions?: React.ReactNode;
}

export function AIContainer({
  title = 'AI suggestion',
  hint,
  actions,
  className,
  children,
  ...props
}: AIContainerProps) {
  return (
    <div
      className={cn('rounded-md border border-green/20 bg-green-soft p-4', className)}
      {...props}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="inline-flex size-6 items-center justify-center rounded-full bg-green/10 text-green">
          <Sparkles className="size-3.5" aria-hidden />
        </span>
        <span className="text-h3 text-green">{title}</span>
        {hint && <span className="ml-auto text-micro uppercase text-green/70">{hint}</span>}
      </div>
      <div className="text-body text-ink">{children}</div>
      {actions && <div className="mt-3 flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

// Inline AI marker for compact spots (e.g. a row hint). Same visual language.
export function AISpark({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1 text-green', className)}>
      <Sparkles className="size-3.5" aria-hidden />
    </span>
  );
}
