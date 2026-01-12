import type { ComponentType } from "react";
import type { MermaidConfig } from "mermaid";
import type { Pluggable } from "unified";
import type { BundledTheme, TokensResult } from "shiki";

/**
 * Result from code highlighting
 */
export type HighlightResult = TokensResult;

/**
 * Options for highlighting code
 */
export interface HighlightOptions {
  code: string;
  language: string;
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
  supportsLanguage: (language: string) => boolean;
  /**
   * Get list of supported languages
   */
  getSupportedLanguages: () => string[];
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
 * Union type for all plugins
 */
export type StreamdownPlugin = CodeHighlighterPlugin | DiagramPlugin | MathPlugin;

/**
 * Plugin configuration passed to Streamdown
 */
export interface PluginConfig {
  shiki?: CodeHighlighterPlugin;
  mermaid?: DiagramPlugin;
  katex?: MathPlugin;
}
