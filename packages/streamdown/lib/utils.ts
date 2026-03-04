import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export type CnFunction = (...inputs: ClassValue[]) => string;

/**
 * Prepends a prefix to each Tailwind utility class in a class string.
 * Used to support Tailwind v4's `prefix()` feature.
 *
 * @example
 * prefixClasses("tw", "flex items-center") // "tw:flex tw:items-center"
 * prefixClasses("tw", "dark:bg-red-500")   // "tw:dark:bg-red-500"
 */
export const prefixClasses = (prefix: string, classString: string): string => {
  if (!prefix || !classString) return classString;
  const prefixWithColon = `${prefix}:`;
  return classString
    .split(/\s+/)
    .filter(Boolean)
    .map((cls) => cls.startsWith(prefixWithColon) ? cls : `${prefix}:${cls}`)
    .join(" ");
};

/**
 * Creates a prefix-aware `cn` function. When no prefix is provided,
 * returns the standard `cn` with zero overhead.
 */
export const createCn = (prefix?: string): CnFunction => {
  if (!prefix) return cn;
  return (...inputs: ClassValue[]) => prefixClasses(prefix, twMerge(clsx(inputs)));
};

export const save = (filename: string, content: string | Blob, mimeType: string) => {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
