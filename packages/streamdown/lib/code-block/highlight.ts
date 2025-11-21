import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type Highlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

// Singleton cache for highlighters
const highlighterCache = new Map<string, Promise<Highlighter>>();

// Helper to generate cache key
const getCacheKey = (
  language: BundledLanguage,
  themes: [BundledTheme, BundledTheme]
) => `${language}-${themes[0]}-${themes[1]}`;

export const createShiki = (
  language: BundledLanguage,
  shikiTheme: [BundledTheme, BundledTheme]
) => {
  const cacheKey = getCacheKey(language, shikiTheme);

  // Return cached highlighter if it exists
  if (highlighterCache.has(cacheKey)) {
    return highlighterCache.get(cacheKey) as Promise<Highlighter>;
  }

  // Create new highlighter and cache it
  const highlighterPromise = createHighlighter({
    themes: shikiTheme,
    langs: [language],
    engine: jsEngine,
  });

  highlighterCache.set(cacheKey, highlighterPromise);

  return highlighterPromise;
};
