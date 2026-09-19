"use client";

import type { Link, Root, Text } from "mdast";
import remarkCjkFriendly from "remark-cjk-friendly";
import remarkCjkFriendlyGfmStrikethrough from "remark-cjk-friendly-gfm-strikethrough";
import type { Pluggable, Plugin } from "unified";
import type { Parent } from "unist";
import { visit } from "unist-util-visit";

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

// CJK punctuation characters that should not be part of autolinks
const CJK_AUTOLINK_BOUNDARY_CHARS = new Set<string>([
  "。",
  "．",
  "，",
  "、",
  "？",
  "！",
  "：",
  "；",
  "（",
  "）",
  "【",
  "】",
  "「",
  "」",
  "『",
  "』",
  "〈",
  "〉",
  "《",
  "》",
]);

const AUTOLINK_PREFIX_PATTERN = /^(https?:\/\/|mailto:|www\.)/i;

const isAutolinkLiteral = (node: Link): node is Link & { children: [Text] } => {
  if (node.children.length !== 1) {
    return false;
  }

  const child = node.children[0];
  return child.type === "text" && child.value === node.url;
};

const findCjkBoundaryIndex = (url: string): number | null => {
  let index = 0;
  for (const char of url) {
    if (CJK_AUTOLINK_BOUNDARY_CHARS.has(char)) {
      return index;
    }
    index += char.length;
  }
  return null;
};

const buildAutolink = (url: string, source: Link): Link => ({
  ...source,
  url,
  children: [
    {
      type: "text",
      value: url,
    },
  ],
});

const buildTrailingText = (value: string): Text => ({
  type: "text",
  value,
});

/**
 * Expand a GFM autolink literal that may contain CJK punctuation into
 * alternating link and text nodes, re-detecting bare URLs after each split.
 *
 * GFM treats `https://a.com；https://b.com` as one link. Splitting only at the
 * first boundary would leave subsequent URLs as plain text; this walks the
 * full string so each URL becomes its own link.
 */
const expandAutolinkAtCjkBoundaries = (
  url: string,
  source: Link
): Array<Link | Text> => {
  const nodes: Array<Link | Text> = [];
  let remaining = url;

  while (remaining.length > 0) {
    if (AUTOLINK_PREFIX_PATTERN.test(remaining)) {
      const boundaryIndex = findCjkBoundaryIndex(remaining);
      if (boundaryIndex === null || boundaryIndex === 0) {
        nodes.push(buildAutolink(remaining, source));
        break;
      }

      nodes.push(buildAutolink(remaining.slice(0, boundaryIndex), source));
      remaining = remaining.slice(boundaryIndex);
      continue;
    }

    const nextUrlMatch = remaining.match(/https?:\/\/|mailto:|www\./i);
    if (!nextUrlMatch || nextUrlMatch.index === undefined) {
      nodes.push(buildTrailingText(remaining));
      break;
    }

    if (nextUrlMatch.index > 0) {
      nodes.push(buildTrailingText(remaining.slice(0, nextUrlMatch.index)));
    }
    remaining = remaining.slice(nextUrlMatch.index);
  }

  return nodes;
};

/**
 * Remark plugin to split literal autolinks at CJK punctuation boundaries
 * so trailing text is not swallowed by the URL. When trailing text contains
 * further bare URLs (e.g. separated by fullwidth semicolons), those are
 * re-linkified as well.
 */
const remarkCjkAutolinkBoundary: Plugin<[], Root> = () => (tree) => {
  visit(
    tree,
    "link",
    (node: Link, index: number | null | undefined, parent?: Parent) => {
      if (!parent || typeof index !== "number") {
        return;
      }

      if (!isAutolinkLiteral(node)) {
        return;
      }

      if (!AUTOLINK_PREFIX_PATTERN.test(node.url)) {
        return;
      }

      const boundaryIndex = findCjkBoundaryIndex(node.url);
      if (boundaryIndex === null || boundaryIndex === 0) {
        return;
      }

      const nodes = expandAutolinkAtCjkBoundaries(node.url, node);
      parent.children.splice(index, 1, ...nodes);
      return index + nodes.length;
    }
  );
};

/**
 * Create a CJK plugin
 */
export function createCjkPlugin(): CjkPlugin {
  // Plugins that must run BEFORE remarkGfm
  // remark-cjk-friendly modifies emphasis handling and must come before GFM
  const remarkPluginsBefore: Pluggable[] = [remarkCjkFriendly];

  // Plugins that must run AFTER remarkGfm
  // - remarkCjkAutolinkBoundary needs GFM autolinks to be created first
  // - remarkCjkFriendlyGfmStrikethrough enhances GFM strikethrough
  const remarkPluginsAfter: Pluggable[] = [
    remarkCjkAutolinkBoundary,
    remarkCjkFriendlyGfmStrikethrough,
  ];

  // Combined array for backwards compatibility
  const remarkPlugins: Pluggable[] = [
    ...remarkPluginsBefore,
    ...remarkPluginsAfter,
  ];

  return {
    name: "cjk",
    type: "cjk",
    remarkPluginsBefore,
    remarkPluginsAfter,
    remarkPlugins,
  };
}

/**
 * Pre-configured CJK plugin with default settings
 */
export const cjk = createCjkPlugin();
