'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// The portal is invite-only: there is no account-creation endpoint here. This
// just routes a pasted invite code to the existing /invite/[token] activation
// flow, which validates the token server-side.
export function InviteCodeForm() {
  const t = useTranslations('signup');
  const router = useRouter();
  const [code, setCode] = useState('');

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim();
    if (trimmed) router.push(`/invite/${encodeURIComponent(trimmed)}`);
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder={t('invitePlaceholder')}
        aria-label={t('invitePlaceholder')}
        className="flex-1"
      />
      <Button type="submit" disabled={!code.trim()}>
        {t('inviteCta')}
        <ArrowRight />
      </Button>
    </form>
  );
}
