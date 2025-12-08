/**
 * Common languages bundled with Streamdown
 * These are the most frequently used languages that should have zero latency.
 * Other languages will be loaded on-demand from CDN.
 */

import type { LanguageRegistration } from "shiki";
// Shell & Config
import bash from "shiki/langs/bash.mjs";
import css from "shiki/langs/css.mjs";
// Modern Systems Languages
import go from "shiki/langs/go.mjs";
import html from "shiki/langs/html.mjs";
// Web Development (Core)
import javascript from "shiki/langs/javascript.mjs";
import json from "shiki/langs/json.mjs";
import jsx from "shiki/langs/jsx.mjs";
import markdown from "shiki/langs/markdown.mjs";
// Popular Languages
import python from "shiki/langs/python.mjs";
import shellscript from "shiki/langs/shellscript.mjs";
import sql from "shiki/langs/sql.mjs";
import toml from "shiki/langs/toml.mjs";
import tsx from "shiki/langs/tsx.mjs";
import typescript from "shiki/langs/typescript.mjs";
import yaml from "shiki/langs/yaml.mjs";

export const bundledLanguages: Record<
  string,
  LanguageRegistration | LanguageRegistration[]
> = {
  javascript,
  typescript,
  jsx,
  tsx,
  html,
  css,
  json,
  bash,
  shellscript,
  shell: shellscript, // alias
  sh: bash, // alias
  yaml,
  yml: yaml, // alias
  toml,
  python,
  py: python, // alias
  markdown,
  md: markdown, // alias
  sql,
  go,
  golang: go, // alias
} as const;

export type BundledLanguageName = keyof typeof bundledLanguages;

/**
 * Check if a language is bundled (instant loading)
 */
export const isBundledLanguage = (
  language: string
): language is BundledLanguageName => language in bundledLanguages;
