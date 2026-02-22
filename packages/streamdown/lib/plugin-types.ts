import type { MermaidConfig } from "mermaid";
import type { BundledLanguage, BundledTheme } from "shiki";

/**
 * A custom theme object compatible with shiki's ThemeRegistrationAny.
 * Must have a `name` property for identification and caching.
 */
export interface CustomTheme {
  name: string;
  [key: string]: unknown;
}

/**
 * Theme input type that accepts either a built-in theme name or a custom theme object.
 */
export type ThemeInput = BundledTheme | CustomTheme;

import type { Pluggable } from "unified";

/**
 * A single token in a highlighted line
 */
export interface HighlightToken {
  bgColor?: string;
  color?: string;
  content: string;
  htmlAttrs?: Record<string, string>;
  htmlStyle?: Record<string, string>;
  offset?: number;
}

/**
 * Result from code highlighting (compatible with shiki's TokensResult)
 */
export interface HighlightResult {
  bg?: string;
  fg?: string;
  rootStyle?: string | false;
  tokens: HighlightToken[][];
}

/**
 * Options for highlighting code
 */
export interface HighlightOptions {
  code: string;
  language: BundledLanguage;
  themes: [string, string] | [ThemeInput, ThemeInput];
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
 * Mermaid instance interface
 */
export interface MermaidInstance {
  initialize: (config: MermaidConfig) => void;
  render: (id: string, source: string) => Promise<{ svg: string }>;
}

/**
 * Plugin for diagram rendering (Mermaid)
 */
export interface DiagramPlugin {
  /**
   * Get the mermaid instance (initialized with optional config)
   */
  getMermaid: (config?: MermaidConfig) => MermaidInstance;
  /**
   * Language identifier for code blocks
   */
  language: string;
  name: "mermaid";
  type: "diagram";
}

/**
 * Plugin for math rendering (KaTeX)
 */
export interface MathPlugin {
  /**
   * Get CSS styles for math rendering (injected into head)
   */
  getStyles?: () => string;
  name: "katex";
  /**
   * Get rehype plugin for rendering math
   */
  rehypePlugin: Pluggable;
  /**
   * Get remark plugin for parsing math syntax
   */
  remarkPlugin: Pluggable;
  type: "math";
}

/**
 * Plugin for CJK text handling
 */
export interface CjkPlugin {
  name: "cjk";
  /**
   * @deprecated Use remarkPluginsBefore and remarkPluginsAfter instead
   * All remark plugins (for backwards compatibility)
   */
  remarkPlugins: Pluggable[];
  /**
   * Remark plugins that must run AFTER remarkGfm
   * (e.g., autolink boundary splitting, strikethrough enhancements)
   */
  remarkPluginsAfter: Pluggable[];
  /**
   * Remark plugins that must run BEFORE remarkGfm
   * (e.g., remark-cjk-friendly which modifies emphasis handling)
   */
  remarkPluginsBefore: Pluggable[];
  type: "cjk";
}

/**
 * Union type for all plugins
 */
export type StreamdownPlugin =
  | CodeHighlighterPlugin
  | DiagramPlugin
  | MathPlugin
  | CjkPlugin;

/**
 * Plugin configuration passed to Streamdown
 */
export interface PluginConfig {
  cjk?: CjkPlugin;
  code?: CodeHighlighterPlugin;
  math?: MathPlugin;
  mermaid?: DiagramPlugin;
}
