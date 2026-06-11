import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// Our type scale (§2) defines custom font-size utilities (text-display, text-h1,
// …, text-micro). tailwind-merge doesn't know these are font sizes, so by default
// it mis-classifies e.g. `text-small` as a text COLOR and strips a preceding
// `text-white` — which silently turned every green button's label dark. Register
// the tokens in the font-size group so colour and size no longer collide.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [{ text: ['display', 'h1', 'h2', 'h3', 'body', 'small', 'micro'] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
