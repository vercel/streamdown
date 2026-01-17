"use client";

import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { Pluggable } from "unified";

/**
 * Plugin for math rendering (KaTeX)
 */
export interface MathPlugin {
  name: "katex";
  type: "math";
  /**
   * Remark plugin for parsing math syntax
   */
  remarkPlugin: Pluggable;
  /**
   * Rehype plugin for rendering math
   */
  rehypePlugin: Pluggable;
  /**
   * Get CSS styles path for math rendering
   */
  getStyles?: () => string;
}

/**
 * Options for creating a math plugin
 */
export interface MathPluginOptions {
  /**
   * Enable single dollar sign for inline math ($...$)
   * @default false
   */
  singleDollarTextMath?: boolean;
  /**
   * KaTeX error color
   * @default "var(--color-muted-foreground)"
   */
  errorColor?: string;
}

/**
 * Create a math plugin with optional configuration
 */
export function createMathPlugin(options: MathPluginOptions = {}): MathPlugin {
  const remarkMathPlugin: Pluggable = [
    remarkMath,
    { singleDollarTextMath: options.singleDollarTextMath ?? false },
  ];

  const rehypeKatexPlugin: Pluggable = [
    rehypeKatex,
    { errorColor: options.errorColor ?? "var(--color-muted-foreground)" },
  ];

  return {
    name: "katex",
    type: "math",
    remarkPlugin: remarkMathPlugin,
    rehypePlugin: rehypeKatexPlugin,
    getStyles() {
      // Users should import katex CSS in their app:
      // import "katex/dist/katex.min.css";
      // This method provides the path for reference
      return "katex/dist/katex.min.css";
    },
  };
}

/**
 * Pre-configured math plugin with default settings
 */
export const mathPlugin = createMathPlugin();
