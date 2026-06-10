'use client';

// Minimal toast store + hook (§19 §4), adapted from the shadcn pattern. Keeps a
// small in-memory queue and notifies subscribers; the <Toaster> renders them.
import * as React from 'react';
import type { ToastProps } from './toast';

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
};

const LIMIT = 3;
const REMOVE_DELAY = 5000;

let count = 0;
function genId(): string {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

type State = { toasts: ToasterToast[] };
const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function setState(next: State) {
  memoryState = next;
  listeners.forEach((l) => l(memoryState));
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  const id = genId();
  const dismiss = () =>
    setState({ toasts: memoryState.toasts.filter((t) => t.id !== id) });

  setState({
    toasts: [
      { ...props, id, open: true, onOpenChange: (open: boolean) => !open && dismiss() },
      ...memoryState.toasts,
    ].slice(0, LIMIT),
  });

  setTimeout(dismiss, REMOVE_DELAY);
  return { id, dismiss };
}

export function useToast() {
  const [state, setLocal] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setLocal);
    return () => {
      const i = listeners.indexOf(setLocal);
      if (i > -1) listeners.splice(i, 1);
    };
  }, []);
  return { ...state, toast };
}
