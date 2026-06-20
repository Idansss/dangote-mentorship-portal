import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

export function BrandMark({
  className,
  inverse = false,
}: {
  className?: string;
  inverse?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 64 64"
      aria-hidden="true"
      className={cn('size-9 shrink-0', inverse ? 'text-white' : 'text-[#10b91f]', className)}
    >
      <path
        d="M4 2h25c18 0 29 8 29 22 0 8-4 14-11 18 9 3 14 9 14 19H4V2Z"
        fill="currentColor"
        opacity={inverse ? 0.2 : 1}
      />
      <path
        d="M14 57 23 13l-1 37c0 5 2 6 5 1l10-18c3-5 7-3 6 3l-3 18c-1 5 2 7 6 3l7-8"
        fill="none"
        stroke={inverse ? '#10b91f' : 'white'}
        strokeWidth="4.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function BrandLogo({
  name,
  className,
  markClassName,
  wordmarkClassName,
  accentClassName,
  inverse = false,
}: {
  name: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  accentClassName?: string;
  inverse?: boolean;
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark className={markClassName} inverse={inverse} />
      <Wordmark
        name={name}
        className={cn('truncate font-display text-h3 font-bold', wordmarkClassName)}
        accentClassName={accentClassName}
      />
    </span>
  );
}
