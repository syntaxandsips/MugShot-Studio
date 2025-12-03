import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to conditionally join CSS class names.
 * Uses clsx for conditional classes and twMerge for Tailwind CSS support.
 * 
 * @param inputs - Class values to be merged
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}