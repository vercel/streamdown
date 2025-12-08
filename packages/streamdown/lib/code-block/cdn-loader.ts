/**
 * CDN Language Loader
 * Loads Shiki language grammars from CDN for languages not bundled with Streamdown
 */

import type { LanguageRegistration } from "shiki";

// Default CDN configuration
const DEFAULT_CDN_BASE = "https://cdn.jsdelivr.net/npm/shiki@1.22.0/dist/langs";
const DEFAULT_TIMEOUT = 5000;

// In-memory cache for loaded language grammars
const cdnLanguageCache = new Map<string, LanguageRegistration>();

// Track failed language loads to avoid repeated requests
const failedLanguages = new Set<string>();

/**
 * Load a language grammar from CDN
 * @param language - Language identifier (e.g., 'rust', 'ruby', 'elixir')
 * @returns Language grammar or null if loading fails
 */
export async function loadLanguageFromCDN(
  language: string
): Promise<LanguageRegistration | null> {
  const cdnUrl = DEFAULT_CDN_BASE;
  const timeout = DEFAULT_TIMEOUT;

  const cacheKey = `${cdnUrl}/${language}`;

  // Return cached language if available
  if (cdnLanguageCache.has(cacheKey)) {
    return cdnLanguageCache.get(cacheKey) as LanguageRegistration;
  }

  // Skip if previously failed
  if (failedLanguages.has(cacheKey)) {
    return null;
  }

  try {
    const url = `${cdnUrl}/${language}.mjs`;

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    // Get the module text
    const moduleText = await response.text();

    // Create a blob URL to import the module
    const blob = new Blob([moduleText], { type: "application/javascript" });
    const blobUrl = URL.createObjectURL(blob);

    try {
      // Dynamic import from blob URL
      const module = await import(
        /* @vite-ignore */ /* webpackIgnore: true */ blobUrl
      );
      const grammar = module.default || module;

      // Clean up blob URL
      URL.revokeObjectURL(blobUrl);

      // Cache the grammar
      cdnLanguageCache.set(cacheKey, grammar);

      return grammar;
    } catch (importError) {
      // Clean up blob URL on error
      URL.revokeObjectURL(blobUrl);
      throw importError;
    }
  } catch (error) {
    // Mark as failed to avoid repeated attempts
    failedLanguages.add(cacheKey);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.warn(
      `[Streamdown] Failed to load language "${language}" from CDN: ${errorMessage}`
    );

    return null;
  }
}
