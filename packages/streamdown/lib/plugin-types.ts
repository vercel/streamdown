import type { MermaidConfig } from "mermaid";
import type { BundledLanguage, BundledTheme } from "shiki";
import type { Pluggable } from "unified";

/**
 * A single token in a highlighted line
 */
export interface HighlightToken {
  content: string;
  color?: string;
  bgColor?: string;
  htmlStyle?: Record<string, string>;
  htmlAttrs?: Record<string, string>;
  offset?: number;
}

/**
 * Result from code highlighting (compatible with shiki's TokensResult)
 */
export interface HighlightResult {
  tokens: HighlightToken[][];
  fg?: string;
  bg?: string;
  rootStyle?: string | false;
}

/**
 * Options for highlighting code
 */
export interface HighlightOptions {
  code: string;
  language: BundledLanguage;
  themes: [string, string];
}

/**
 * Plugin for code syntax highlighting (Shiki)
 */
export interface CodeHighlighterPlugin {
  name: "shiki";
  type: "code-highlighter";
  /**
   * Highlight code and return tokens
   * Returns null if highlighting not ready yet (async loading)
   * Use callback for async result
   */
  highlight: (
    options: HighlightOptions,
    callback?: (result: HighlightResult) => void
  ) => HighlightResult | null;
  /**
   * Check if language is supported
   */
  supportsLanguage: (language: BundledLanguage) => boolean;
  /**
   * Get list of supported languages
   */
  getSupportedLanguages: () => BundledLanguage[];
  /**
   * Get the configured themes
   */
  getThemes: () => [BundledTheme, BundledTheme];
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
  name: "mermaid";
  type: "diagram";
  /**
   * Language identifier for code blocks
   */
  language: string;
  /**
   * Get the mermaid instance (initialized with optional config)
   */
  getMermaid: (config?: MermaidConfig) => MermaidInstance;
}

/**
 * Plugin for math rendering (KaTeX)
 */
export interface MathPlugin {
  name: "katex";
  type: "math";
  /**
   * Get remark plugin for parsing math syntax
   */
  remarkPlugin: Pluggable;
  /**
   * Get rehype plugin for rendering math
   */
  rehypePlugin: Pluggable;
  /**
   * Get CSS styles for math rendering (injected into head)
   */
  getStyles?: () => string;
}

/**
 * Plugin for CJK text handling
 */
export interface CjkPlugin {
  name: "cjk";
  type: "cjk";
  /**
   * Remark plugins that must run BEFORE remarkGfm
   * (e.g., remark-cjk-friendly which modifies emphasis handling)
   */
  remarkPluginsBefore: Pluggable[];
  /**
   * Remark plugins that must run AFTER remarkGfm
   * (e.g., autolink boundary splitting, strikethrough enhancements)
   */
  remarkPluginsAfter: Pluggable[];
  /**
   * @deprecated Use remarkPluginsBefore and remarkPluginsAfter instead
   * All remark plugins (for backwards compatibility)
   */
  remarkPlugins: Pluggable[];
}

/**
 * Plugin for text animation during streaming
 */
export interface AnimatePlugin {
  name: "animate";
  type: "animate";
  rehypePlugin: Pluggable;
}

/**
 * Union type for all plugins
 */
export type StreamdownPlugin =
  | CodeHighlighterPlugin
  | DiagramPlugin
  | MathPlugin
  | CjkPlugin
  | AnimatePlugin;

/**
 * Plugin configuration passed to Streamdown
 */
export interface PluginConfig {
  code?: CodeHighlighterPlugin;
  mermaid?: DiagramPlugin;
  math?: MathPlugin;
  cjk?: CjkPlugin;
  animate?: AnimatePlugin;
}
