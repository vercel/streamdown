"use client";

import {
  type BundledLanguage,
  type BundledTheme,
  bundledLanguages,
  bundledLanguagesInfo,
  createHighlighter,
  type GrammarState,
  type HighlighterGeneric,
  type SpecialLanguage,
  type ThemedToken,
  type ThemeRegistrationAny,
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

/**
 * Tokenization state carried between highlight requests of one highlighter.
 *
 * While a code block streams, each request extends the previous one. TextMate
 * grammars tokenize line by line with a state stack, so the completed lines of
 * the previous request tokenize identically in the next one. Only the lines
 * completed since then and the trailing partial line are tokenized; the rest
 * reuses the previous token rows.
 */
interface IncrementalState {
  /** Grammar state after the last line of `prefix` */
  grammarState: GrammarState | undefined;
  /** The completed-line prefix of the previous code (ends with a newline) */
  prefix: string;
  /** Token rows for the lines in `prefix` */
  rows: ThemedToken[][];
}

// Recent incremental states per highlighter (language + themes), most recent
// first. A few slots let blocks that stream at the same time in different
// renderers each pick up their own state instead of evicting each other.
const incrementalStates = new Map<string, IncrementalState[]>();
const MAX_INCREMENTAL_STATES = 4;

const takeIncrementalState = (
  stateKey: string,
  code: string
): IncrementalState | undefined => {
  const states = incrementalStates.get(stateKey);
  if (!states) {
    return;
  }
  const index = states.findIndex((state) => code.startsWith(state.prefix));
  return index === -1 ? undefined : states.splice(index, 1)[0];
};

const storeIncrementalState = (
  stateKey: string,
  state: IncrementalState
): void => {
  let states = incrementalStates.get(stateKey);
  if (!states) {
    states = [];
    incrementalStates.set(stateKey, states);
  }
  states.unshift(state);
  if (states.length > MAX_INCREMENTAL_STATES) {
    states.pop();
  }
};

const shiftOffsets = (rows: ThemedToken[][], by: number): void => {
  if (by === 0) {
    return;
  }
  for (const row of rows) {
    for (const token of row) {
      token.offset += by;
    }
  }
};

const tokenize = (
  highlighter: HighlighterGeneric<BundledLanguage, BundledTheme>,
  code: string,
  stateKey: string,
  lang: BundledLanguage | SpecialLanguage,
  themes: { light: string; dark: string }
): TokensResult => {
  const state = takeIncrementalState(stateKey, code);
  let prefix = state ? state.prefix : "";
  let rows = state ? state.rows : [];
  let grammarState = state?.grammarState;

  // Tokenize the lines completed since the previous request, carrying the
  // grammar state over so the result matches a full tokenization.
  const lineEnd = code.lastIndexOf("\n") + 1;
  if (lineEnd > prefix.length) {
    const completed = highlighter.codeToTokens(
      code.slice(prefix.length, lineEnd),
      { lang, themes, grammarState }
    );
    const newRows = completed.tokens;
    // The trailing newline yields an empty row that belongs to the next line
    newRows.pop();
    shiftOffsets(newRows, prefix.length);
    rows = rows.concat(newRows);
    grammarState = completed.grammarState;
    prefix = code.slice(0, lineEnd);
    storeIncrementalState(stateKey, { grammarState, prefix, rows });
  } else if (state) {
    storeIncrementalState(stateKey, state);
  }

  // The partial last line is tokenized on every request
  const tail = highlighter.codeToTokens(code.slice(lineEnd), {
    lang,
    themes,
    grammarState,
  });
  shiftOffsets(tail.tokens, lineEnd);
  return { ...tail, tokens: rows.concat(tail.tokens) };
};

// Subscribers for async token updates
const subscribers = new Map<string, Set<(result: TokensResult) => void>>();

const getThemeName = (theme: ThemeInput): string =>
  typeof theme === "string" ? theme : (theme.name ?? "custom");

const getHighlighterCacheKey = (
  language: BundledLanguage | SpecialLanguage,
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
  language: BundledLanguage | SpecialLanguage,
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

      // Resolve language to 'text' if not supported (e.g. truncated identifier)
      const safeLanguage: BundledLanguage | SpecialLanguage = languageNames.has(
        resolvedLanguage as BundledLanguage
      )
        ? (resolvedLanguage as BundledLanguage)
        : "text";

      // Start highlighting in background
      getHighlighter(safeLanguage, themes)
        .then((highlighter) => {
          const availableLangs = highlighter.getLoadedLanguages();
          const langToUse = (
            availableLangs.includes(resolvedLanguage as BundledLanguage)
              ? (resolvedLanguage as BundledLanguage)
              : "text"
          ) as BundledLanguage | SpecialLanguage;

          const result = tokenize(
            highlighter,
            code,
            `${getHighlighterCacheKey(safeLanguage, themes)}:${langToUse}`,
            langToUse,
            { light: themeNames[0], dark: themeNames[1] }
          );

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
