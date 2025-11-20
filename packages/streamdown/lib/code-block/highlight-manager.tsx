import {
  type BundledLanguage,
  type BundledTheme,
  createHighlighter,
} from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import {
  getFallbackLanguage,
  getTransformersFromPreClassName,
  isLanguageSupported,
} from "./highlighter";

class HighlighterManager {
  private highlighter: Awaited<ReturnType<typeof createHighlighter>> | null =
    null;
  private lightTheme: BundledTheme | null = null;
  private darkTheme: BundledTheme | null = null;
  private readonly loadedLanguages: Set<BundledLanguage> = new Set();
  private initializationPromise: Promise<void> | null = null;
  private loadLanguagePromise: Promise<void> | null = null;

  // LRU cache for highlighted code - increased from 50 to 500 for code-heavy documents
  // Now caching single HTML string instead of tuple
  private readonly cache = new Map<string, string>();
  private cacheKeys: string[] = [];
  private readonly MAX_CACHE_SIZE = 500;

  // Queue to deduplicate concurrent highlight requests
  private readonly highlightQueue = new Map<string, Promise<string>>();

  private getCacheKey(
    code: string,
    language: string,
    preClassName?: string
  ): string {
    return `${language}::${preClassName || ""}::${code}`;
  }

  private addToCache(key: string, value: string): void {
    // Remove oldest entry if cache is full
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const oldestKey = this.cacheKeys.shift();
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }
    this.cache.set(key, value);
    this.cacheKeys.push(key);
  }

  private needsHighlighterInitialization(
    themes: [BundledTheme, BundledTheme]
  ): boolean {
    const [lightTheme, darkTheme] = themes;
    // Check if we need to recreate highlighter due to theme change
    return (
      !this.highlighter ||
      this.lightTheme !== lightTheme ||
      this.darkTheme !== darkTheme
    );
  }

  private async ensureHighlighterInitialized(
    themes: [BundledTheme, BundledTheme]
  ): Promise<void> {
    const [lightTheme, darkTheme] = themes;
    const jsEngine = createJavaScriptRegexEngine({ forgiving: true });

    // If themes changed, reset loaded languages, clear cache, and clear queue
    this.loadedLanguages.clear();
    this.cache.clear();
    this.cacheKeys = [];
    this.highlightQueue.clear();

    // Create single highlighter with both themes
    this.highlighter = await createHighlighter({
      themes: [lightTheme, darkTheme],
      langs: [],
      engine: jsEngine,
    });
    this.lightTheme = lightTheme;
    this.darkTheme = darkTheme;
  }

  private async loadLanguage(language: BundledLanguage): Promise<void> {
    // Load the language for the single highlighter
    await this.highlighter?.loadLanguage(language);
    this.loadedLanguages.add(language);
  }

  async initializeHighlighters(
    themes: [BundledTheme, BundledTheme]
  ): Promise<void> {
    // Ensure only one initialization happens at a time
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    const needsRecreation = this.needsHighlighterInitialization(themes);

    if (needsRecreation) {
      // Initialize highlighter with both themes
      this.initializationPromise = this.ensureHighlighterInitialized(themes);
      await this.initializationPromise;
      this.initializationPromise = null;
    }
  }

  private performHighlight(
    code: string,
    language: BundledLanguage,
    preClassName?: string
  ): string {
    const lang = isLanguageSupported(language)
      ? language
      : getFallbackLanguage();

    if (
      this.highlighter === null ||
      this.lightTheme === null ||
      this.darkTheme === null
    ) {
      throw new Error(
        "highlightCode must be called after initializeHighlighters."
      );
    }

    const transformers = getTransformersFromPreClassName(preClassName);

    // Use Shiki's dual-theme support - single pass highlighting with CSS variables
    // This automatically handles light/dark mode switching via CSS
    return this.highlighter.codeToHtml(code, {
      lang,
      themes: {
        light: this.lightTheme,
        dark: this.darkTheme,
      },
      transformers,
    });
  }

  // biome-ignore lint/suspicious/useAwait: "async is simpler than wrapping the cache return in a promise"
  async highlightCode(
    code: string,
    language: BundledLanguage,
    preClassName?: string,
    signal?: AbortSignal
  ): Promise<string> {
    // Check cache first
    const cacheKey = this.getCacheKey(code, language, preClassName);
    const cached = this.cache.get(cacheKey);
    if (cached) {
      // Move to end (LRU)
      this.cacheKeys = this.cacheKeys.filter((k) => k !== cacheKey);
      this.cacheKeys.push(cacheKey);
      return cached;
    }

    // Check if already highlighting this exact code (deduplicate concurrent requests)
    const existing = this.highlightQueue.get(cacheKey);
    if (existing) {
      return existing;
    }

    const checkSignal = () => {
      if (signal?.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
    };

    // Create promise for this highlight operation
    const highlightPromise = (async () => {
      try {
        // Check if aborted before starting
        checkSignal();

        // Wait for initialization to complete before proceeding
        if (this.initializationPromise) {
          await this.initializationPromise;
        }

        // Check again after await
        checkSignal();

        // Ensure only one language load happens at a time
        if (this.loadLanguagePromise) {
          await this.loadLanguagePromise;
        }

        // Check again after await
        checkSignal();

        const needsLanguageLoad =
          !this.loadedLanguages.has(language) && isLanguageSupported(language);

        if (needsLanguageLoad) {
          this.loadLanguagePromise = this.loadLanguage(language);
          await this.loadLanguagePromise;
          this.loadLanguagePromise = null;
        }

        // Check again after await
        checkSignal();

        const result = this.performHighlight(code, language, preClassName);
        this.addToCache(cacheKey, result);
        return result;
      } finally {
        // Clean up queue entry
        this.highlightQueue.delete(cacheKey);
      }
    })();

    // Store in queue to deduplicate concurrent requests
    this.highlightQueue.set(cacheKey, highlightPromise);
    return highlightPromise;
  }
}

// Create a singleton instance of the highlighter manager
export const highlighterManager = new HighlighterManager();
