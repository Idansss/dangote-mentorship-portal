'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { runMatching } from './actions';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';

export interface RunMatchingLabels {
  run: string;
  running: string;
  doneTitle: string;
  /** Uses {suggested} and {mentees} placeholders. */
  done: string;
  allMatched: string;
  errorTitle: string;
}

// Replaces the bare server-action form so the admin gets feedback: a toast with
// the run result (suggestions produced, or "all already matched") and a refresh
// so new suggestions appear. Previously the button silently posted with no
// visible change when the cohort was already fully matched — looked broken.
export function RunMatchingButton({ cohortId, labels }: { cohortId: string; labels: RunMatchingLabels }) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  function run() {
    const fd = new FormData();
    fd.set('cohortId', cohortId);
    startTransition(async () => {
      const res = await runMatching(fd);
      if (res.ok) {
        toast({
          title: labels.doneTitle,
          description:
            res.data.suggested > 0
              ? labels.done
                  .replace('{suggested}', String(res.data.suggested))
                  .replace('{mentees}', String(res.data.menteesMatched))
              : labels.allMatched,
        });
        router.refresh();
      } else {
        toast({ title: labels.errorTitle, description: res.error.message, variant: 'destructive' });
      }
    });
  }

  return (
    <Button type="button" onClick={run} disabled={pending}>
      {pending ? labels.running : labels.run}
    </Button>
  );
}
