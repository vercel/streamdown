"use client";

import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import type { Pluggable } from "unified";
import type { CjkPlugin } from "../../lib/plugin-types";
import { remarkCjkAutolinkBoundary } from "../../lib/remark/cjk-autolink";

/**
 * Create a CJK plugin with optional configuration
 */
export function createCjkPlugin(): CjkPlugin {
  const remarkPlugins: Pluggable[] = [
    [remarkCjkAutolinkBoundary, {}],
    [remarkCjkFriendly, {}],
    [remarkCjkFriendlyGfmStrikethrough, {}],
  ];

  return {
    name: "cjk",
    type: "cjk",
    remarkPlugins,
  };
}

/**
 * Pre-configured CJK plugin with default settings
 */
export const cjkPlugin = createCjkPlugin();

// Re-export types
export type { CjkPlugin } from "../../lib/plugin-types";
