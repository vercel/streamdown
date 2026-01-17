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
  type: "cjk";
  /**
   * Remark plugins for CJK text handling
   */
  remarkPlugins: Pluggable[];
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
 * Remark plugin to split literal autolinks at CJK punctuation boundaries
 * so trailing text is not swallowed by the URL.
 */
const remarkCjkAutolinkBoundary: Plugin<[], Root> = () => (tree) => {
  visit(tree, "link", (node: Link, index: number | null, parent?: Parent) => {
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

    const trimmedUrl = node.url.slice(0, boundaryIndex);
    const trailing = node.url.slice(boundaryIndex);

    const trimmedLink = buildAutolink(trimmedUrl, node);
    const trailingText = buildTrailingText(trailing);

    parent.children.splice(index, 1, trimmedLink, trailingText);
    return index + 1;
  });
};

/**
 * Create a CJK plugin
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
