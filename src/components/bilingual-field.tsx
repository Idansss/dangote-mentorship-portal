import * as React from 'react';
import { Languages } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { TranslateToggle } from '@/components/translate-toggle';
import { cn } from '@/lib/utils';

// Bilingual field control (§19 §6) — every user-generated text field carries the
// inline EN/FR affordance. French users write French; the toggle is for the
// reader, never a wall (CLAUDE.md §16).
//
//   BilingualField   — the compose control (label + field + 🌐 EN|FR language
//                      chip). The writer's active language is emphasized.
//   BilingualContent — the read control: shows saved content with an on-demand,
//                      cached translate toggle and a quiet source-language tag.

type Lang = 'EN' | 'FR';

interface BilingualFieldProps {
  id: string;
  name: string;
  label: string;
  /** The writer's active language (from their locale) — emphasized in the chip. */
  lang: Lang;
  as?: 'textarea' | 'input';
  defaultValue?: string;
  /** Controlled value. Pass with `onChange` for forms that autosave a draft. */
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  helperText?: string;
  rows?: number;
  className?: string;
}

export function BilingualField({
  id,
  name,
  label,
  lang,
  as = 'textarea',
  defaultValue,
  value,
  onChange,
  placeholder,
  required,
  helperText,
  rows,
  className,
}: BilingualFieldProps) {
  // Controlled when an onChange handler is supplied (autosaving forms); else the
  // field stays uncontrolled with a defaultValue (server-action forms).
  const controlled = onChange
    ? { value: value ?? '', onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) }
    : { defaultValue };

  return (
    <div className={cn('space-y-1.5', className)}>
      <Label htmlFor={id}>
        {label}
        {required && <span className="ml-0.5 text-risk">*</span>}
      </Label>
      {as === 'input' ? (
        <Input id={id} name={name} placeholder={placeholder} required={required} {...controlled} />
      ) : (
        <Textarea id={id} name={name} placeholder={placeholder} required={required} rows={rows} {...controlled} />
      )}
      <div className="flex items-center justify-between gap-2 text-micro">
        <span className="inline-flex items-center gap-1.5 text-ink-3">
          <Languages className="size-3.5" aria-hidden />
          <span className={cn(lang === 'EN' ? 'font-semibold text-ink-2' : '')}>EN</span>
          <span aria-hidden>|</span>
          <span className={cn(lang === 'FR' ? 'font-semibold text-ink-2' : '')}>FR</span>
        </span>
        {helperText && <span className="text-ink-3">{helperText}</span>}
      </div>
    </div>
  );
}

interface BilingualContentProps {
  entityType: string;
  entityId: string;
  text: string;
  sourceLang: Lang;
  /** Quiet "in {lang}" source tag shown above the content. */
  showSourceTag?: boolean;
  className?: string;
}

export function BilingualContent({
  entityType,
  entityId,
  text,
  sourceLang,
  showSourceTag = true,
  className,
}: BilingualContentProps) {
  return (
    <div className={cn('space-y-1', className)}>
      {showSourceTag && (
        <span className="inline-flex items-center gap-1 text-micro uppercase text-ink-3">
          <Languages className="size-3" aria-hidden />
          {sourceLang}
        </span>
      )}
      <TranslateToggle
        entityType={entityType}
        entityId={entityId}
        text={text}
        sourceLang={sourceLang}
        className="text-body text-ink"
      />
    </div>
  );
}
