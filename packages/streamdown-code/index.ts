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

interface CachedTokens {
  code: string;
  /** The cache key of the language and theme pair plus the code key */
  key: string;
  /**
   * Set when this result continues an earlier result of its block: the
   * earlier code while that could still be a finished block of its own, then
   * `true` once the block is known to be streaming
   */
  previous?: string | true;
  result: TokensResult;
}

/** A code block that may still be growing */
interface Stream {
  /** The code of its latest result */
  code: string;
  /** Its last few results that a later request replaced, oldest first */
  replaced: CachedTokens[];
}

// Highlight results, oldest first. While a code block streams, each request
// extends the previous one and the previous result is not needed again. Once
// a block has grown twice in a row, its earlier results leave the cache; the
// block keeps the last few in case it steps back (a closing fence that arrives
// in pieces ends on code that was requested before it). A block that only
// repeats and extends another one once, as when a chat history loads, leaves
// the other one in place. Past MAX_CACHED_CHARACTERS of cached code in total,
// the oldest results are dropped.
const tokensCache = new Map<string, CachedTokens>();
const MAX_CACHED_CHARACTERS = 2_000_000;
let cachedCharacters = 0;

// Blocks that may still be growing, per language and theme pair, most recent
// first; a few, so blocks that stream at the same time each replace their own
// results
const streams = new Map<string, Stream[]>();
const MAX_STREAMS = 4;
const MAX_REPLACED_RESULTS = 4;

// A key that is cheap to build and hash for long code; a lookup still
// compares the full code.
const getResultKey = (cacheKey: string, code: string): string =>
  code.length > 200
    ? `${cacheKey}\n${code.length}:${code.slice(0, 100)}:${code.slice(-100)}`
    : `${cacheKey}\n${code}`;

const findResult = (
  cacheKey: string,
  code: string
): CachedTokens | undefined => {
  const entry = tokensCache.get(getResultKey(cacheKey, code));
  return entry?.code === code ? entry : undefined;
};

const removeResult = (entry: CachedTokens): void => {
  if (tokensCache.get(entry.key) === entry) {
    tokensCache.delete(entry.key);
    cachedCharacters -= entry.code.length;
  }
};

const addResult = (entry: CachedTokens): void => {
  const existing = tokensCache.get(entry.key);
  if (existing) {
    removeResult(existing);
  }
  tokensCache.set(entry.key, entry);
  cachedCharacters += entry.code.length;
  while (cachedCharacters > MAX_CACHED_CHARACTERS && tokensCache.size > 1) {
    removeResult(tokensCache.values().next().value as CachedTokens);
  }
};

// Moves the result of `code` out of the cache into the stream's replaced ones
const replace = (cacheKey: string, stream: Stream, code: string): void => {
  const entry = findResult(cacheKey, code);
  if (!entry) {
    return;
  }
  removeResult(entry);
  stream.replaced.push(entry);
  if (stream.replaced.length > MAX_REPLACED_RESULTS) {
    stream.replaced.shift();
  }
};

// Whether `code` continues `previous`. This only decides which result is no
// longer needed, never which tokens are returned, so for long code only the
// start and the end of `previous` are compared instead of the whole block on
// every update.
const continues = (code: string, previous: string): boolean =>
  previous.length < code.length &&
  (previous.length <= 200
    ? code.startsWith(previous)
    : code.startsWith(previous.slice(0, 100)) &&
      code.startsWith(previous.slice(-100), previous.length - 100));

// Makes `stream` the most recent one of its language and theme pair
const touchStream = (list: Stream[], stream: Stream): void => {
  const index = list.indexOf(stream);
  if (index !== -1) {
    list.splice(index, 1);
  }
  list.unshift(stream);
  if (list.length > MAX_STREAMS) {
    list.pop();
  }
};

// What a block drops when it steps back: a closing fence that arrived in
// pieces and was part of the code until it was complete
const CLOSING_FENCE_PIECE = /^\r?\n[`~]*$/;

/**
 * Returns the cached result for `code`. A result that a streaming block had
 * replaced is restored when the block steps back to it, and the longer code
 * it stepped back from is replaced instead.
 */
const getCachedTokens = (
  cacheKey: string,
  code: string
): TokensResult | undefined => {
  const entry = findResult(cacheKey, code);
  if (entry) {
    return entry.result;
  }
  const list = streams.get(cacheKey);
  const stream = list?.find((item) =>
    item.replaced.some((replaced) => replaced.code === code)
  );
  if (!(list && stream)) {
    return;
  }
  const index = stream.replaced.findIndex((item) => item.code === code);
  const [restored] = stream.replaced.splice(index, 1);
  const stepsBack =
    stream.code.length > code.length &&
    stream.code.startsWith(code) &&
    CLOSING_FENCE_PIECE.test(stream.code.slice(code.length));
  if (stepsBack) {
    replace(cacheKey, stream, stream.code);
    stream.code = code;
    touchStream(list, stream);
    addResult(restored);
  } else {
    // Another block passing through the same code: a result like any other
    setCachedTokens(cacheKey, code, restored.result);
  }
  return restored.result;
};

const setCachedTokens = (
  cacheKey: string,
  code: string,
  result: TokensResult
): void => {
  let list = streams.get(cacheKey);
  if (!list) {
    list = [];
    streams.set(cacheKey, list);
  }
  let stream = list.find((item) => continues(code, item.code));
  let previous: string | true | undefined;
  if (stream) {
    const replacedEntry = findResult(cacheKey, stream.code);
    if (replacedEntry && replacedEntry.previous === undefined) {
      // The first time a result is continued it may be a finished block that
      // another block repeats; keep it until this block grows again
      previous = stream.code;
    } else {
      if (typeof replacedEntry?.previous === "string") {
        replace(cacheKey, stream, replacedEntry.previous);
      }
      replace(cacheKey, stream, stream.code);
      previous = true;
    }
    stream.code = code;
  } else {
    stream = { code, replaced: [] };
  }
  touchStream(list, stream);
  addResult({ code, key: getResultKey(cacheKey, code), previous, result });
};

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

const getThemeName = (theme: ThemeInput): string =>
  typeof theme === "string" ? theme : (theme.name ?? "custom");

const getHighlighterCacheKey = (
  language: BundledLanguage | SpecialLanguage,
  themes: [ThemeInput, ThemeInput]
) => `${language}-${getThemeName(themes[0])}-${getThemeName(themes[1])}`;

const getTokensCacheKey = (language: string, themeNames: [string, string]) =>
  `${language}:${themeNames[0]}:${themeNames[1]}`;

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
      // Resolve language to 'text' if not supported (e.g. truncated identifier)
      const safeLanguage: BundledLanguage | SpecialLanguage = languageNames.has(
        resolvedLanguage as BundledLanguage
      )
        ? (resolvedLanguage as BundledLanguage)
        : "text";
      const tokensCacheKey = getTokensCacheKey(safeLanguage, themeNames);

      // Return cached result if available
      const cached = getCachedTokens(tokensCacheKey, code);
      if (cached) {
        return cached;
      }

      // Start highlighting in background
      getHighlighter(safeLanguage, themes)
        .then((highlighter) => {
          const availableLangs = highlighter.getLoadedLanguages();
          const langToUse = (
            availableLangs.includes(resolvedLanguage as BundledLanguage)
              ? (resolvedLanguage as BundledLanguage)
              : "text"
          ) as BundledLanguage | SpecialLanguage;

          // An earlier request for the same code may have finished first
          let result = getCachedTokens(tokensCacheKey, code);
          if (!result) {
            result = tokenize(
              highlighter,
              code,
              `${getHighlighterCacheKey(safeLanguage, themes)}:${langToUse}`,
              langToUse,
              { light: themeNames[0], dark: themeNames[1] }
            );
            setCachedTokens(tokensCacheKey, code, result);
          }

          callback?.(result);
        })
        .catch((error) => {
          console.error("[Streamdown Code] Failed to highlight code:", error);
        });

      return null;
    },
  };
}

/**
 * Pre-configured code plugin with default settings
 */
export const code = createCodePlugin();
