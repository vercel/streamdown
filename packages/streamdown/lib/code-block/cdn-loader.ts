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

// Regex to extract relative imports like: import foo from './bar.mjs'
const importRegex = /import\s+\w+\s+from\s+['"]\.\/([\w-]+)\.mjs['"]/g;

// Track languages currently being loaded to prevent circular dependencies
const loadingLanguages = new Set<string>();

/**
 * Load a single language grammar file from CDN (without dependencies)
 */
async function loadSingleLanguageFromCDN(
  language: string,
  langsUrl: string,
  timeout: number
): Promise<{ grammar: LanguageRegistration; dependencies: string[] } | null> {
  const url = `${langsUrl}/${language}.mjs`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const response = await fetch(url, {
    signal: controller.signal,
  });

  clearTimeout(timeoutId);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const moduleText = await response.text();

  // Extract dependencies from import statements
  const dependencies: string[] = [];
  let match = importRegex.exec(moduleText);
  while (match !== null) {
    dependencies.push(match[1]);
    match = importRegex.exec(moduleText);
  }
  // Reset regex lastIndex for next use
  importRegex.lastIndex = 0;

  // Extract the JSON string from the JSON.parse() call
  const jsonParseMatch = moduleText.match(jsonParseRegex);
  if (!jsonParseMatch) {
    throw new Error("Could not find JSON.parse() in CDN response");
  }

  const jsonString = JSON.parse(jsonParseMatch[1]);
  const grammar = JSON.parse(jsonString) as LanguageRegistration;

  return { grammar, dependencies };
}

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

  // Prevent circular dependencies
  if (loadingLanguages.has(cacheKey)) {
    return null;
  }

  try {
    loadingLanguages.add(cacheKey);

    const result = await loadSingleLanguageFromCDN(language, langsUrl, timeout);
    if (!result) {
      throw new Error("Failed to load language");
    }

    const { grammar, dependencies } = result;
    const allGrammars: LanguageRegistration[] = [];

    // Load dependencies first (they need to be registered before the main language)
    for (const dep of dependencies) {
      const depCacheKey = `${langsUrl}/${dep}`;

      // Skip if already cached
      if (cdnLanguageCache.has(depCacheKey)) {
        const cached = cdnLanguageCache.get(
          depCacheKey
        ) as LanguageRegistration[];
        allGrammars.push(...cached);
        continue;
      }

      // Skip if already loading (circular dep) or failed
      if (
        loadingLanguages.has(depCacheKey) ||
        failedLanguages.has(depCacheKey)
      ) {
        continue;
      }

      // Recursively load dependency
      const depGrammars = await loadLanguageFromCDN(dep, cdnBaseUrl, timeout);
      if (depGrammars) {
        allGrammars.push(...depGrammars);
      }
    }

    // Add the main grammar last
    allGrammars.push(grammar);

    // Cache the complete result (main grammar only, deps are cached separately)
    cdnLanguageCache.set(cacheKey, [grammar]);

    return allGrammars;
  } catch (error) {
    failedLanguages.add(cacheKey);

    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    console.warn(
      `[Streamdown] Failed to load language "${language}" from CDN: ${errorMessage}`
    );

    return null;
  } finally {
    loadingLanguages.delete(cacheKey);
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
