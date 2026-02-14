import type { CSSProperties } from 'react';
import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { HighlightToken } from './plugin-types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const getTokenStyle = (token: HighlightToken): CSSProperties => {
  const style: Record<string, string> = {};

  if (token.color) style["--sdm-c"] = token.color;
  if (token.bgColor) style["--sdm-tbg"] = token.bgColor;

  if (token.htmlStyle) {
    const { color, "background-color": bg, ...cssVars } = token.htmlStyle;
    Object.assign(style, cssVars);
    if (color) style["--sdm-c"] = color;
    if (bg) style["--sdm-tbg"] = bg;
  }

  return style as CSSProperties;
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