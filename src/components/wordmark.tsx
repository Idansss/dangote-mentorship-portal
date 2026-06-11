// Two-tone brand wordmark (Atlas "Atlas HR" style): the brand token "Dangote" is
// rendered in an accent colour, the rest inherits the surrounding text colour.
// Splitting on the token keeps it locale-safe — it works wherever "Dangote"
// sits in the translated app name (EN "Dangote Mentorship Portal" / FR "Portail
// de mentorat Dangote"). Presentational only (no hooks), so it can be used from
// both server and client components.
export function Wordmark({
  name,
  className,
  accentClassName = 'text-green-light',
}: {
  name: string;
  className?: string;
  accentClassName?: string;
}) {
  const parts = name.split(/(Dangote)/i);
  return (
    <span className={className}>
      {parts.map((part, i) =>
        /^dangote$/i.test(part) ? (
          <span key={i} className={accentClassName}>
            {part}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </span>
  );
}
