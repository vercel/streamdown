/**
 * CDN Loader
 * Loads Shiki language grammars and themes from CDN for items not bundled with Streamdown
 */

import type { LanguageRegistration, ThemeRegistration } from "shiki";
import packageJson from "../../package.json";

// Default CDN configuration
// Uses a base URL that can be configured via the cdnUrl prop
const SHIKI_VERSION = packageJson.dependencies.shiki.replace(/^\^/, "");
const DEFAULT_TIMEOUT = 5000;

// Helper to construct the full shiki CDN path from a base CDN URL
const getShikiBasePath = (cdnBaseUrl: string) =>
  `${cdnBaseUrl}/shiki/${SHIKI_VERSION}`;

// In-memory cache for loaded language grammars
const cdnLanguageCache = new Map<string, LanguageRegistration[]>();

// In-memory cache for loaded themes
const cdnThemeCache = new Map<string, ThemeRegistration>();

// Track failed language loads to avoid repeated requests
const failedLanguages = new Set<string>();

// Track failed theme loads to avoid repeated requests
const failedThemes = new Set<string>();

const jsonParseRegex = /JSON\.parse\(("(?:[^"\\]|\\.)*")\)/;

/**
 * Load a language grammar from CDN
 * @param language - Language identifier (e.g., 'rust', 'ruby', 'elixir')
 * @param cdnBaseUrl - Base URL for CDN (e.g., 'https://www.streamdown.ai/cdn'), or null to disable
 * @param timeout - Request timeout in milliseconds (default: 5000)
 * @returns Language grammar array or null if loading fails
 */
export async function loadLanguageFromCDN(
  language: string,
  cdnBaseUrl?: string | null,
  timeout: number = DEFAULT_TIMEOUT
): Promise<LanguageRegistration[] | null> {
  // If CDN is explicitly disabled (null) or no base URL provided, return null
  if (cdnBaseUrl === null || cdnBaseUrl === undefined) {
    return null;
  }

  const shikiBasePath = getShikiBasePath(cdnBaseUrl);
  const langsUrl = `${shikiBasePath}/langs`;

  const cacheKey = `${langsUrl}/${language}`;

  // Return cached language if available
  if (cdnLanguageCache.has(cacheKey)) {
    return cdnLanguageCache.get(cacheKey) as LanguageRegistration[];
  }

  // Skip if previously failed
  if (failedLanguages.has(cacheKey)) {
    return null;
  }

  try {
    const url = `${langsUrl}/${language}.mjs`;

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
      const jsonParseMatch = moduleText.match(jsonParseRegex);
      if (!jsonParseMatch) {
        throw new Error("Could not find JSON.parse() in CDN response");
      }

      // The matched string is already a valid JSON string literal
      // We can parse it directly to get the unescaped version
      const jsonString = JSON.parse(jsonParseMatch[1]);

      // Now parse the actual grammar JSON
      const langObject = JSON.parse(jsonString) as LanguageRegistration;

      // Shiki expects an array, so wrap it
      const grammar: LanguageRegistration[] = [langObject];

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

/**
 * Load a theme from CDN
 * @param theme - Theme identifier (e.g., 'dracula', 'nord', 'one-dark-pro')
 * @param cdnBaseUrl - Base URL for CDN (e.g., 'https://www.streamdown.ai/cdn'), or null to disable
 * @param timeout - Request timeout in milliseconds (default: 5000)
 * @returns Theme registration or null if loading fails
 */
export async function loadThemeFromCDN(
  theme: string,
  cdnBaseUrl?: string | null,
  timeout: number = DEFAULT_TIMEOUT
): Promise<ThemeRegistration | null> {
  // If CDN is explicitly disabled (null) or no base URL provided, return null
  if (cdnBaseUrl === null || cdnBaseUrl === undefined) {
    return null;
  }

  const shikiBasePath = getShikiBasePath(cdnBaseUrl);
  const themesUrl = `${shikiBasePath}/themes`;

  const cacheKey = `${themesUrl}/${theme}`;

  // Return cached theme if available
  if (cdnThemeCache.has(cacheKey)) {
    return cdnThemeCache.get(cacheKey) as ThemeRegistration;
  }

  // Skip if previously failed
  if (failedThemes.has(cacheKey)) {
    return null;
  }

  try {
    const url = `${themesUrl}/${theme}.mjs`;

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
    // Shiki theme files have structure: export default Object.freeze(JSON.parse("{...}"))
    const moduleText = await response.text();

    try {
      // Extract the JSON string from the JSON.parse() call
      const jsonParseMatch = moduleText.match(jsonParseRegex);
      if (!jsonParseMatch) {
        throw new Error("Could not find JSON.parse() in CDN response");
      }

      // The matched string is already a valid JSON string literal
      const jsonString = JSON.parse(jsonParseMatch[1]);

      // Now parse the actual theme JSON
      const themeObject = JSON.parse(jsonString) as ThemeRegistration;

      // Cache the theme
      cdnThemeCache.set(cacheKey, themeObject);

      return themeObject;
    } catch (parseError) {
      throw new Error(
        `Failed to parse theme: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
      );
    }
  } catch (error) {
    // Mark as failed to avoid repeated attempts
    failedThemes.add(cacheKey);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.warn(
      `[Streamdown] Failed to load theme "${theme}" from CDN: ${errorMessage}`
    );

    return null;
  }
}
