import { type ClassValue, clsx } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Logical utilities (`ps`, `pe`, `ms`, `me`, `border-s`, `border-e`, `start`,
 * `end`) and their physical counterparts control the same box edge, but
 * tailwind-merge does not know that: by default `twMerge("ps-4", "pl-2")`
 * keeps both, so a consumer `className` override is decided by stylesheet
 * order instead of by the order the caller wrote the classes.
 *
 * Direction is a runtime property, so a static merge cannot tell whether `ps`
 * resolves to `pl` or `pr`. Treating both as conflicting means the last class
 * written wins, which matches caller intent.
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
} as const;

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
