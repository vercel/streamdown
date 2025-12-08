/**
 * CDN Language Loader
 * Loads Shiki language grammars from CDN for languages not bundled with Streamdown
 */

import type { LanguageRegistration } from "shiki";
import packageJson from "../../package.json";

// Default CDN configuration
// Uses a relative URL that can be proxied by the host application
// For example, Next.js can rewrite /cdn/shiki/:version/langs/* to jsDelivr
const SHIKI_VERSION = packageJson.dependencies.shiki.replace(/^\^/, "");
const DEFAULT_CDN_BASE = `/cdn/shiki/${SHIKI_VERSION}/langs`;
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
    // Shiki language files have structure: const lang = Object.freeze(JSON.parse("{...}")); export default [lang];
    const moduleText = await response.text();

    try {
      // Extract the JSON string from the JSON.parse() call
      // Need to handle nested quotes and escapes properly
      const jsonParseMatch = moduleText.match(/JSON\.parse\(("(?:[^"\\]|\\.)*")\)/);
      if (!jsonParseMatch) {
        throw new Error("Could not find JSON.parse() in CDN response");
      }

      // The matched string is already a valid JSON string literal
      // We can parse it directly to get the unescaped version
      const jsonString = JSON.parse(jsonParseMatch[1]);

      // Now parse the actual grammar JSON
      const langObject = JSON.parse(jsonString);

      // Shiki expects an array, so wrap it
      const grammar = [langObject];

      // Cache the grammar
      cdnLanguageCache.set(cacheKey, grammar);

      return grammar;
    } catch (parseError) {
      throw new Error(
        `Failed to parse language grammar: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      );
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
