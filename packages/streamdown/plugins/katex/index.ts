"use client";

import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import type { Pluggable } from "unified";
import type { MathPlugin } from "../../lib/plugin-types";

// Note: katex.min.css should be imported by the user or bundled appropriately
// We provide a getStyles method that returns the CSS import path

/**
 * Options for creating a KaTeX plugin
 */
export interface KatexPluginOptions {
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
 * Create a KaTeX plugin with optional configuration
 */
export function createKatexPlugin(options: KatexPluginOptions = {}): MathPlugin {
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
 * Pre-configured KaTeX plugin with default settings
 */
export const katexPlugin = createKatexPlugin();

// Re-export types
export type { MathPlugin } from "../../lib/plugin-types";
