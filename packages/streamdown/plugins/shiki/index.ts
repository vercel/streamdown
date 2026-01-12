"use client";

import type { BundledTheme, TokensResult, HighlighterCore, SpecialLanguage, LanguageInput } from "shiki";
import { bundledLanguages, bundledThemes } from "shiki";
import { createHighlighterCore } from "shiki/core";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import type { CodeHighlighterPlugin, HighlightOptions, HighlightResult } from "../../lib/plugin-types";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

// Build language name set for quick lookup
const languageNames = new Set<string>(Object.keys(bundledLanguages));

// Singleton highlighter cache
const highlighterCache = new Map<string, Promise<HighlighterCore>>();

// Token cache
const tokensCache = new Map<string, TokensResult>();

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokensResult) => void>>();

const getHighlighterCacheKey = (
  language: string,
  themeNames: [string, string]
) => `${language}-${themeNames[0]}-${themeNames[1]}`;

const getTokensCacheKey = (
  code: string,
  language: string,
  themeNames: [string, string]
) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${themeNames[0]}:${themeNames[1]}:${code.length}:${start}:${end}`;
};

const createHighlighter = (
  language: string,
  themeNames: [string, string]
): Promise<HighlighterCore> => {
  const cacheKey = getHighlighterCacheKey(language, themeNames);

  if (highlighterCache.has(cacheKey)) {
    return highlighterCache.get(cacheKey) as Promise<HighlighterCore>;
  }

  const highlighterPromise = (async () => {
    // Get language grammar (lazy-loaded from shiki)
    const langLoader = bundledLanguages[language as keyof typeof bundledLanguages];

    // Build langs array - either load the language or fall back to "text"
    let langs: LanguageInput[];
    if (langLoader) {
      const langModule = await langLoader();
      // The loader returns a module with default export containing the language registration
      const langRegistration = langModule?.default ?? langModule;
      langs = [langRegistration as LanguageInput];
    } else {
      langs = ["text" as unknown as LanguageInput];
    }

    // Get theme registrations (lazy-loaded from shiki)
    const themeRegistrations = await Promise.all(
      themeNames.map(async (name) => {
        const themeLoader = bundledThemes[name as keyof typeof bundledThemes];
        if (!themeLoader) {
          console.warn(`[Streamdown Shiki] Theme "${name}" not found. Using github-${name.includes("dark") ? "dark" : "light"}.`);
          const fallbackLoader = name.includes("dark")
            ? bundledThemes["github-dark"]
            : bundledThemes["github-light"];
          return await fallbackLoader();
        }
        return await themeLoader();
      })
    );

    const highlighter = await createHighlighterCore({
      themes: themeRegistrations,
      langs,
      engine: jsEngine,
    });

    return highlighter;
  })();

  highlighterCache.set(cacheKey, highlighterPromise);
  return highlighterPromise;
};

/**
 * Shiki plugin for syntax highlighting
 * Supports all languages and themes from shiki
 */
export const shikiPlugin: CodeHighlighterPlugin = {
  name: "shiki",
  type: "code-highlighter",

  supportsLanguage(language: string): boolean {
    return languageNames.has(language);
  },

  getSupportedLanguages(): string[] {
    return Array.from(languageNames);
  },

  getThemes(): [BundledTheme, BundledTheme] {
    return ["github-light", "github-dark"];
  },

  highlight(
    { code, language, themes: themeNames }: HighlightOptions,
    callback?: (result: HighlightResult) => void
  ): HighlightResult | null {
    const tokensCacheKey = getTokensCacheKey(code, language, themeNames as [string, string]);

    // Return cached result if available
    if (tokensCache.has(tokensCacheKey)) {
      return tokensCache.get(tokensCacheKey) as TokensResult;
    }

    // Subscribe callback if provided
    if (callback) {
      if (!subscribers.has(tokensCacheKey)) {
        subscribers.set(tokensCacheKey, new Set());
      }
      const subs = subscribers.get(tokensCacheKey) as Set<(result: TokensResult) => void>;
      subs.add(callback);
    }

    // Start highlighting in background
    createHighlighter(language, themeNames as [string, string])
      .then((highlighter) => {
        const availableLangs = highlighter.getLoadedLanguages();
        const langToUse = (
          availableLangs.includes(language) ? language : "text"
        ) as SpecialLanguage;

        const result = highlighter.codeToTokens(code, {
          lang: langToUse,
          themes: {
            light: themeNames[0] as BundledTheme,
            dark: themeNames[1] as BundledTheme,
          },
        });

        // Cache the result
        tokensCache.set(tokensCacheKey, result);

        // Notify all subscribers
        const subs = subscribers.get(tokensCacheKey);
        if (subs) {
          for (const sub of subs) {
            sub(result);
          }
          subscribers.delete(tokensCacheKey);
        }
      })
      .catch((error) => {
        console.error("[Streamdown Shiki] Failed to highlight code:", error);
        subscribers.delete(tokensCacheKey);
      });

    return null;
  },
};

// Re-export types
export type { CodeHighlighterPlugin, HighlightOptions, HighlightResult } from "../../lib/plugin-types";
