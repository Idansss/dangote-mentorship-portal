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
      viewBox="0 0 48 48"
      aria-hidden="true"
      className={cn('size-9 shrink-0', inverse ? 'text-white' : 'text-green', className)}
    >
      <rect
        x="2"
        y="2"
        width="44"
        height="44"
        rx="14"
        fill="currentColor"
        opacity={inverse ? 0.16 : 1}
      />
      <path
        d="M15 34V14h8.2C31.4 14 37 18.1 37 24s-5.6 10-13.8 10H15Z"
        fill="none"
        stroke="white"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="m18.5 29.5 5.2-5.2 4.4 2.4 2.4-6.2"
        fill="none"
        stroke="white"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="18.5" cy="29.5" r="2.1" fill="white" />
      <circle cx="30.5" cy="20.5" r="2.1" fill="white" />
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
