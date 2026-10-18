import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Conditional class names with Tailwind conflict resolution, so a component can
 * accept a `className` override without producing duplicate utilities.
 */
export const cn = (...inputs: ClassValue[]): string => twMerge(clsx(inputs));
