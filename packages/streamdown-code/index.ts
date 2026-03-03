"use client";

import {
  type BundledLanguage,
  type BundledTheme,
  type ThemeRegistrationAny,
  bundledLanguages,
  bundledLanguagesInfo,
  createHighlighter,
  type HighlighterGeneric,
  type SpecialLanguage,
  type TokensResult,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

export type ThemeInput = BundledTheme | ThemeRegistrationAny;

/**
 * Result from code highlighting
 */
export type HighlightResult = TokensResult;

/**
 * Options for highlighting code
 */
export interface HighlightOptions {
  code: string;
  language: BundledLanguage;
  themes: [ThemeInput, ThemeInput];
}

/**
 * Plugin for code syntax highlighting (Shiki)
 */
export interface CodeHighlighterPlugin {
  /**
   * Get list of supported languages
   */
  getSupportedLanguages: () => BundledLanguage[];
  /**
   * Get the configured themes
   */
  getThemes: () => [ThemeInput, ThemeInput];
  /**
   * Highlight code and return tokens
   * Returns null if highlighting not ready yet (async loading)
   * Use callback for async result
   */
  highlight: (
    options: HighlightOptions,
    callback?: (result: HighlightResult) => void
  ) => HighlightResult | null;
  name: "shiki";
  /**
   * Check if language is supported
   */
  supportsLanguage: (language: BundledLanguage) => boolean;
  type: "code-highlighter";
}

/**
 * Options for creating a code plugin
 */
export interface CodePluginOptions {
  /**
   * Default themes for syntax highlighting [light, dark]
   * @default ["github-light", "github-dark"]
   */
  themes?: [ThemeInput, ThemeInput];
}

const languageAliases = Object.fromEntries(
  bundledLanguagesInfo.flatMap((info) =>
    (info.aliases ?? []).map((alias) => [alias, info.id as BundledLanguage])
  )
) as Record<string, BundledLanguage>;

// Build language name set for quick lookup
const languageNames = new Set<BundledLanguage>(
  Object.keys(bundledLanguages) as BundledLanguage[]
);

const normalizeLanguage = (language: string): string => {
  const trimmed = language.trim();
  const lower = trimmed.toLowerCase();
  const alias = languageAliases[lower];
  if (alias) {
    return alias;
  }
  if (languageNames.has(lower as BundledLanguage)) {
    return lower;
  }
  return lower;
};

// Singleton highlighter cache
const highlighterCache = new Map<
  string,
  Promise<HighlighterGeneric<BundledLanguage, BundledTheme>>
>();

// Token cache
const tokensCache = new Map<string, TokensResult>();

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokensResult) => void>>();

const getThemeName = (theme: ThemeInput): string =>
  typeof theme === "string" ? theme : (theme.name ?? "custom");

const getHighlighterCacheKey = (
  language: BundledLanguage,
  themes: [ThemeInput, ThemeInput]
) => `${language}-${getThemeName(themes[0])}-${getThemeName(themes[1])}`;

const getTokensCacheKey = (
  code: string,
  language: string,
  themeNames: [string, string]
) => {
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${themeNames[0]}:${themeNames[1]}:${code.length}:${start}:${end}`;
};

const getHighlighter = (
  language: BundledLanguage,
  themes: [ThemeInput, ThemeInput]
): Promise<HighlighterGeneric<BundledLanguage, BundledTheme>> => {
  const cacheKey = getHighlighterCacheKey(language, themes);

  if (highlighterCache.has(cacheKey)) {
    return highlighterCache.get(cacheKey) as Promise<
      HighlighterGeneric<BundledLanguage, BundledTheme>
    >;
  }

  const highlighterPromise = createHighlighter({
    themes,
    langs: [language],
    engine: jsEngine,
  });

  highlighterCache.set(cacheKey, highlighterPromise);
  return highlighterPromise;
};

/**
 * Create a code plugin with optional configuration
 */
export function createCodePlugin(
  options: CodePluginOptions = {}
): CodeHighlighterPlugin {
  const defaultThemes: [ThemeInput, ThemeInput] = options.themes ?? [
    "github-light",
    "github-dark",
  ];

  return {
    name: "shiki",
    type: "code-highlighter",

    supportsLanguage(language: BundledLanguage): boolean {
      const resolvedLanguage = normalizeLanguage(language);
      return languageNames.has(resolvedLanguage as BundledLanguage);
    },

    getSupportedLanguages(): BundledLanguage[] {
      return Array.from(languageNames);
    },

    getThemes(): [ThemeInput, ThemeInput] {
      return defaultThemes;
    },

    highlight(
      { code, language, themes }: HighlightOptions,
      callback?: (result: HighlightResult) => void
    ): HighlightResult | null {
      const resolvedLanguage = normalizeLanguage(language);
      const themeNames: [string, string] = [
        getThemeName(themes[0]),
        getThemeName(themes[1]),
      ];
      const tokensCacheKey = getTokensCacheKey(
        code,
        resolvedLanguage,
        themeNames
      );

      // Return cached result if available
      if (tokensCache.has(tokensCacheKey)) {
        return tokensCache.get(tokensCacheKey) as TokensResult;
      }

      // Subscribe callback if provided
      if (callback) {
        if (!subscribers.has(tokensCacheKey)) {
          subscribers.set(tokensCacheKey, new Set());
        }
        const subs = subscribers.get(tokensCacheKey) as Set<
          (result: TokensResult) => void
        >;
        subs.add(callback);
      }

      // Start highlighting in background
      getHighlighter(resolvedLanguage as BundledLanguage, themes)
        .then((highlighter) => {
          const availableLangs = highlighter.getLoadedLanguages();
          const langToUse = (
            availableLangs.includes(resolvedLanguage as BundledLanguage)
              ? (resolvedLanguage as BundledLanguage)
              : "text"
          ) as BundledLanguage | SpecialLanguage;

          const result = highlighter.codeToTokens(code, {
            lang: langToUse,
            themes: {
              light: themeNames[0],
              dark: themeNames[1],
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
          console.error("[Streamdown Code] Failed to highlight code:", error);
          subscribers.delete(tokensCacheKey);
        });

      return null;
    },
  };
}

/**
 * Pre-configured code plugin with default settings
 */
export const code = createCodePlugin();
