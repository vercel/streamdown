import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Logical utilities (`ps`, `pe`, `ms`, `me`, `border-s`, `border-e`, `start`,
 * `end`) and their physical counterparts (`pl`, `pr`, `ml`, `mr`, `border-l`,
 * `border-r`, `left`, `right`) control the same box edge, but tailwind-merge
 * does not know that: by default `twMerge("ps-4", "pl-2")` returns both.
 *
 * Emitting both means the winner is decided by the order Tailwind happens to
 * generate its stylesheet, not by the order the caller wrote them — so a
 * consumer overriding a component's padding via `className` would silently get
 * an unpredictable result.
 *
 * Treating them as one axis is deliberately conservative. Direction is a
 * runtime property, so a static merge cannot know whether `ps` resolves to
 * `pl` or `pr`; assuming they conflict means the last class written wins,
 * which is what the caller meant in every realistic case.
 */
const logicalPhysicalConflicts = {
  ps: ['pl', 'pr'],
  pe: ['pl', 'pr'],
  pl: ['ps', 'pe'],
  pr: ['ps', 'pe'],
  px: ['ps', 'pe'],
  ms: ['ml', 'mr'],
  me: ['ml', 'mr'],
  ml: ['ms', 'me'],
  mr: ['ms', 'me'],
  mx: ['ms', 'me'],
  'border-w-s': ['border-w-l', 'border-w-r'],
  'border-w-e': ['border-w-l', 'border-w-r'],
  'border-w-l': ['border-w-s', 'border-w-e'],
  'border-w-r': ['border-w-s', 'border-w-e'],
  'border-w-x': ['border-w-s', 'border-w-e'],
  start: ['left', 'right'],
  end: ['left', 'right'],
  left: ['start', 'end'],
  right: ['start', 'end'],
  'inset-x': ['start', 'end'],
};

const twMerge = extendTailwindMerge({
  extend: { conflictingClassGroups: logicalPhysicalConflicts },
});

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
  // Prepend UTF-8 BOM for CSV so Excel on Windows correctly detects the encoding.
  // Without it, Excel falls back to the system ANSI codepage and corrupts non-ASCII text.
  const bom = typeof content === 'string' && mimeType.startsWith('text/csv') ? '\uFEFF' : '';
  const blob = typeof content === 'string' ? new Blob([bom + content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};
