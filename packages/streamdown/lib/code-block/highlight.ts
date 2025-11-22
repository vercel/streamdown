import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
  type Highlighter,
  type TokensResult,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

// Singleton cache for highlighters
const highlighterCache = new Map<string, Promise<Highlighter>>();

// Cache for highlighted results (tokens)
const tokensCache = new Map<string, TokensResult>();

// Subscribers for token cache updates
const subscribers = new Map<string, Set<(result: TokensResult) => void>>();

// Helper to generate cache key for highlighter
const getHighlighterCacheKey = (
  language: BundledLanguage,
  themes: [BundledTheme, BundledTheme]
) => `${language}-${themes[0]}-${themes[1]}`;

// Helper to generate cache key for tokens
const getTokensCacheKey = (
  code: string,
  language: BundledLanguage,
  themes: [BundledTheme, BundledTheme]
) => {
  // Use a hash of the first and last 100 chars + length for better cache key
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${themes[0]}:${themes[1]}:${code.length}:${start}:${end}`;
};

export const createShiki = (
  language: BundledLanguage,
  shikiTheme: [BundledTheme, BundledTheme]
) => {
  const cacheKey = getHighlighterCacheKey(language, shikiTheme);

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

// Get cached tokens or trigger highlighting
export const getHighlightedTokens = (
  code: string,
  language: BundledLanguage,
  shikiTheme: [BundledTheme, BundledTheme],
  callback?: (result: TokensResult) => void
): TokensResult | null => {
  const tokensCacheKey = getTokensCacheKey(code, language, shikiTheme);

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
  createShiki(language, shikiTheme)
    .then((highlighter) => {
      const result = highlighter.codeToTokens(code, {
        lang: language,
        themes: {
          light: shikiTheme[0],
          dark: shikiTheme[1],
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
        // Clean up subscribers after notifying
        subscribers.delete(tokensCacheKey);
      }
    })
    .catch((error) => {
      console.error("Failed to highlight code:", error);
      // Clean up subscribers on error
      subscribers.delete(tokensCacheKey);
    });

  return null;
};
