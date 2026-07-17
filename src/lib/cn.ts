import cn from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn2(...inputs: Parameters<typeof cn>) {
  return twMerge(cn(...inputs));
}

export { cn2 as cn };
