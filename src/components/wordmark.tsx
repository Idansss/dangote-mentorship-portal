// BLAK MOH wordmark: BLAK inherits the surrounding ink colour while MOH uses
// the brand green and a gold stop, matching the supplied identity.
export function Wordmark({
  name,
  className,
  accentClassName = 'text-[#10b91f]',
}: {
  name: string;
  className?: string;
  accentClassName?: string;
}) {
  const isBrandName = /^BLAK\s+MOH\.?$/i.test(name.trim());

  if (isBrandName) {
    return (
      <span className={className} aria-label="BLAK MOH">
        <span>BLAK</span> <span className={accentClassName}>MOH</span>
        <span className="text-[#d39b2b]">.</span>
      </span>
    );
  }

  return <span className={className}>{name}</span>;
}
