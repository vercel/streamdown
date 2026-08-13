/**
 * Types compatible with Shiki, defined locally so consumers of `streamdown`
 * can type-check without installing the `shiki` package.
 *
 * Runtime highlighting lives in `@streamdown/code`, which depends on `shiki`.
 * Streamdown only needs these types for its plugin API surface (`shikiTheme`,
 * `CodeHighlighterPlugin`, and related re-exports).
 *
 * @see https://shiki.style/languages
 * @see https://shiki.style/themes
 */

/**
 * Language identifier for syntax highlighting.
 * Compatible with Shiki's `BundledLanguage`.
 */
export type BundledLanguage = string;

/**
 * Built-in theme name for syntax highlighting.
 * Compatible with Shiki's `BundledTheme`.
 */
export type BundledTheme = string;

/**
 * Custom theme registration object compatible with Shiki's
 * `ThemeRegistrationAny` (raw, resolved, or intermediate forms).
 *
 * Kept structural and permissive so custom theme objects from
 * `@streamdown/code` / Shiki remain assignable without a type dependency.
 */
export interface ThemeRegistrationAny {
  bg?: string;
  colors?: Record<string, string>;
  displayName?: string;
  fg?: string;
  name?: string;
  semanticHighlighting?: boolean;
  semanticTokenColors?: Record<string, unknown>;
  settings?: unknown[];
  tokenColors?: unknown[];
  type?: "light" | "dark";
}
