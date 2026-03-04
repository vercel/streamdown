"use client";

import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import type { Pluggable } from "unified";

/**
 * Plugin for math rendering (KaTeX)
 */
export interface MathPlugin {
  /**
   * Get CSS styles path for math rendering
   */
  getStyles?: () => string;
  name: "katex";
  /**
   * Rehype plugin for rendering math
   */
  rehypePlugin: Pluggable;
  /**
   * Remark plugin for parsing math syntax
   */
  remarkPlugin: Pluggable;
  type: "math";
}

/**
 * Options for creating a math plugin
 */
export interface MathPluginOptions {
  /**
   * KaTeX error color
   * @default "var(--color-muted-foreground)"
   */
  errorColor?: string;
  /**
   * Enable single dollar sign for inline math ($...$)
   * @default false
   */
  singleDollarTextMath?: boolean;
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
export const math = createMathPlugin();
