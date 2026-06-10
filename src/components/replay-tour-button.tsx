'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { tourStorageKey } from '@/components/onboarding-tour';

// Re-arms the first-login tour (experience-layer.md §1.11): clears the dismissal
// flags so the tour shows again next time a dashboard loads.
const ROLES = ['mentee', 'mentor'];

export function ReplayTourButton() {
  const t = useTranslations('help');
  const [done, setDone] = useState(false);

  function replay() {
    try {
      for (const role of ROLES) localStorage.removeItem(tourStorageKey(role));
    } catch {
      // ignore
    }
    setDone(true);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={replay} disabled={done}>
      {done ? t('tourReset') : t('replayTour')}
    </Button>
  );
}
