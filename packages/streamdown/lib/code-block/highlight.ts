import {
  type BundledTheme,
  createHighlighter,
  type Highlighter,
  type LanguageRegistration,
  type SpecialLanguage,
  type TokensResult,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import {
  type BundledLanguageName,
  bundledLanguages,
  isBundledLanguage,
} from "./bundled-languages";
import { loadLanguageFromCDN } from "./cdn-loader";

const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

// Singleton cache for highlighters
const highlighterCache = new Map<string, Promise<Highlighter>>();

// Cache for highlighted results (tokens)
const tokensCache = new Map<string, TokensResult>();

// Subscribers for token cache updates
const subscribers = new Map<string, Set<(result: TokensResult) => void>>();

// Helper to generate cache key for highlighter
const getHighlighterCacheKey = (
  language: string,
  themes: [BundledTheme, BundledTheme]
) => `${language}-${themes[0]}-${themes[1]}`;

// Helper to generate cache key for tokens
const getTokensCacheKey = (
  code: string,
  language: string,
  themes: [BundledTheme, BundledTheme]
) => {
  // Use a hash of the first and last 100 chars + length for better cache key
  const start = code.slice(0, 100);
  const end = code.length > 100 ? code.slice(-100) : "";
  return `${language}:${themes[0]}:${themes[1]}:${code.length}:${start}:${end}`;
};

/**
 * Load a language grammar - either from bundled languages or CDN
 */
async function loadLanguageGrammar(
  language: string
): Promise<LanguageRegistration | LanguageRegistration[] | null> {
  // Check if it's a bundled language (instant load)
  if (isBundledLanguage(language)) {
    const bundled = bundledLanguages[language as BundledLanguageName];
    return bundled;
  }

  // Otherwise, load from CDN
  const grammar = await loadLanguageFromCDN(language);

  if (!grammar) {
    console.warn(
      `[Streamdown] Language "${language}" not found in bundled languages or CDN. Falling back to plain text.`
    );
  }

  return grammar;
}

/**
 * Create a Shiki highlighter for a specific language and themes
 * Uses hybrid loading: bundled languages load instantly, others load from CDN
 */
export const createShiki = (
  language: string,
  shikiTheme: [BundledTheme, BundledTheme]
): Promise<Highlighter> => {
  const cacheKey = getHighlighterCacheKey(language, shikiTheme);

  // Return cached highlighter if it exists
  if (highlighterCache.has(cacheKey)) {
    return highlighterCache.get(cacheKey) as Promise<Highlighter>;
  }

  // Create new highlighter and cache it
  const highlighterPromise = (async () => {
    // Load the language grammar (bundled or from CDN)
    const languageGrammar = await loadLanguageGrammar(language);

    // Fall back to 'text' if language couldn't be loaded
    // Note: languageGrammar can be a single LanguageRegistration or an array of them
    const langs: (
      | LanguageRegistration
      | LanguageRegistration[]
      | SpecialLanguage
    )[] = languageGrammar ? [languageGrammar] : ["text"];

    const highlighter = await createHighlighter({
      themes: shikiTheme,
      langs,
      engine: jsEngine,
    });

    return highlighter;
  })();

  highlighterCache.set(cacheKey, highlighterPromise);

  return highlighterPromise;
};

/**
 * Get cached tokens or trigger highlighting
 * Returns cached result immediately if available, otherwise returns null and calls callback when ready
 */
export const getHighlightedTokens = (
  code: string,
  language: string,
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
      // Determine which language to use for highlighting
      // If the requested language wasn't loaded, the highlighter will only have 'text'
      const availableLangs = highlighter.getLoadedLanguages();
      const langToUse = (
        availableLangs.includes(language) ? language : "text"
      ) as SpecialLanguage;

      const result = highlighter.codeToTokens(code, {
        lang: langToUse,
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
