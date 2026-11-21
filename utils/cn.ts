import { clsx, type ClassValue } from "clsx";

/**
 * Joins class names conditionally.
 *
 * Deliberately not run through tailwind-merge: the design relies on custom
 * variants (`l:`, `s:`, `pc:`) and fluid numeric utilities that must be kept verbatim.
 */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}
