import Image from 'next/image';
import { Wordmark } from '@/components/wordmark';
import { cn } from '@/lib/utils';

// The official BLAK MOH brand mark (the green "B" with the white script "m"),
// served as a transparent PNG from public/brand. It reads on both light and dark
// surfaces, so no recolouring is needed. Sizing is driven by `className`
// (e.g. size-7 / size-14) — the width/height below are just the intrinsic ratio.
export function BrandMark({ className }: { className?: string }) {
  return (
    <Image
      src="/brand/blak-moh-mark.png"
      alt="BLAK MOH"
      width={64}
      height={64}
      className={cn('size-9 shrink-0 object-contain', className)}
    />
  );
}

export function BrandLogo({
  name,
  className,
  markClassName,
  wordmarkClassName,
  accentClassName,
}: {
  name: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
  accentClassName?: string;
}) {
  return (
    <span className={cn('inline-flex min-w-0 items-center gap-2.5', className)}>
      <BrandMark className={markClassName} />
      <Wordmark
        name={name}
        className={cn('truncate font-display text-h3 font-bold', wordmarkClassName)}
        accentClassName={accentClassName}
      />
    </span>
  );
}
