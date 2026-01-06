/**
 * Common themes bundled with Streamdown
 * These are the most frequently used themes that should have zero latency.
 */

import type { ThemeRegistration } from "shiki";

import githubDark from "shiki/themes/github-dark.mjs";
import githubLight from "shiki/themes/github-light.mjs";

export const bundledThemes: Record<string, ThemeRegistration> = {
  "github-light": githubLight,
  "github-dark": githubDark,
} as const;

export type BundledThemeName = keyof typeof bundledThemes;

/**
 * Check if a theme is bundled (instant loading)
 */
export const isBundledTheme = (theme: string): theme is BundledThemeName =>
  theme in bundledThemes;
