"use client";

import type {
  Link,
  Paragraph,
  PhrasingContent,
  Root,
  Strong,
  Text,
} from "mdast";
import { gfmAutolinkLiteralFromMarkdown } from "mdast-util-gfm-autolink-literal";
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
const PUNCTUATION_PATTERN = /[\p{P}\p{S}]/u;
const WHITESPACE_PATTERN = /\s/u;

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

const buildStrong = (child: PhrasingContent): Strong => ({
  type: "strong",
  children: [child],
});

const hasUnescapedDelimiter = (
  source: string,
  offset: number,
  delimiter: string
): boolean => {
  if (
    offset < 0 ||
    source.slice(offset, offset + delimiter.length) !== delimiter
  ) {
    return false;
  }

  let escapeCount = 0;
  for (let index = offset - 1; index >= 0 && source[index] === "\\"; index--) {
    escapeCount++;
  }

  return escapeCount % 2 === 0;
};

const canOpenUnderscoreDelimiter = (
  source: string,
  offset: number
): boolean => {
  const previousCodeUnit = offset - 1;
  const previousCharacter =
    previousCodeUnit < 0
      ? undefined
      : source.slice(
          previousCodeUnit -
            (source.charCodeAt(previousCodeUnit) >= 0xdc_00 &&
            source.charCodeAt(previousCodeUnit) <= 0xdf_ff
              ? 1
              : 0),
          offset
        );
  const nextCodePoint = source.codePointAt(offset + 2);
  const nextCharacter =
    nextCodePoint === undefined
      ? undefined
      : String.fromCodePoint(nextCodePoint);
  const previousIsWhitespace =
    previousCharacter === undefined ||
    WHITESPACE_PATTERN.test(previousCharacter);
  const nextIsWhitespace =
    nextCharacter === undefined || WHITESPACE_PATTERN.test(nextCharacter);
  const previousIsPunctuation =
    previousCharacter !== undefined &&
    PUNCTUATION_PATTERN.test(previousCharacter);
  const nextIsPunctuation =
    nextCharacter !== undefined && PUNCTUATION_PATTERN.test(nextCharacter);
  const leftFlanking =
    !nextIsWhitespace &&
    (!nextIsPunctuation || previousIsWhitespace || previousIsPunctuation);
  const rightFlanking =
    !previousIsWhitespace &&
    (!previousIsPunctuation || nextIsWhitespace || nextIsPunctuation);

  return leftFlanking && (!rightFlanking || previousIsPunctuation);
};

const findStrongDelimiter = (
  source: string,
  previousNode: PhrasingContent | undefined,
  node: Link,
  boundaryIndex: number
): "**" | "__" | null => {
  if (previousNode?.type !== "text") {
    return null;
  }

  const linkStart = node.position?.start.offset;
  const previousEnd = previousNode.position?.end.offset;
  if (typeof linkStart !== "number" || typeof previousEnd !== "number") {
    return null;
  }

  const urlBeforeBoundary = node.url.slice(0, boundaryIndex);
  for (const delimiter of ["**", "__"] as const) {
    if (!previousNode.value.endsWith(delimiter)) {
      continue;
    }

    if (!urlBeforeBoundary.endsWith(delimiter)) {
      continue;
    }

    const openingOffset = previousEnd - delimiter.length;
    const closingOffset = linkStart + boundaryIndex - delimiter.length;
    if (
      hasUnescapedDelimiter(source, openingOffset, delimiter) &&
      (delimiter !== "__" ||
        canOpenUnderscoreDelimiter(source, openingOffset)) &&
      hasUnescapedDelimiter(source, closingOffset, delimiter)
    ) {
      return delimiter;
    }
  }

  return null;
};

const autolinkTransforms = gfmAutolinkLiteralFromMarkdown().transforms ?? [];

/**
 * Re-linkify trailing text with GFM's own URL validation and destination
 * normalization, without interpreting the text as Markdown again.
 * Separate paragraphs prevent autolinks from spanning CJK boundaries.
 * Only their inline children are inserted back into the original tree.
 */
const relinkifyTrailingText = (value: string): PhrasingContent[] => {
  const nodes: PhrasingContent[] = [];
  const append = (text: string) => {
    if (!text) {
      return;
    }
    const paragraph: Paragraph = {
      type: "paragraph",
      children: [buildTrailingText(text)],
    };
    // Prefix-only segments have no host/address. In particular, GFM's text
    // transform would otherwise turn a bare `www.` into `http://www`.
    if (AUTOLINK_PREFIX_PATTERN.exec(text)?.[0] !== text) {
      const tree: Root = { type: "root", children: [paragraph] };
      for (const transform of autolinkTransforms) {
        transform(tree);
      }
    }
    nodes.push(...paragraph.children);
  };
  let start = 0;
  let index = 0;
  for (const char of value) {
    if (CJK_AUTOLINK_BOUNDARY_CHARS.has(char)) {
      append(value.slice(start, index));
      append(char);
      start = index + char.length;
    }
    index += char.length;
  }
  append(value.slice(start));

  return nodes;
};

const replaceAutolinkAtBoundary = (
  node: Link,
  parent: Parent,
  index: number,
  boundaryIndex: number,
  source: string
): number => {
  let replaceIndex = index;
  const previousNode = parent.children[index - 1] as
    | PhrasingContent
    | undefined;
  const strongDelimiter = findStrongDelimiter(
    source,
    previousNode,
    node,
    boundaryIndex
  );
  if (strongDelimiter && previousNode?.type === "text") {
    previousNode.value = previousNode.value.slice(0, -strongDelimiter.length);
    if (!previousNode.value) {
      parent.children.splice(index - 1, 1);
      replaceIndex--;
    }
  }

  const urlBeforeBoundary = node.url.slice(0, boundaryIndex);
  const link = buildAutolink(
    strongDelimiter
      ? urlBeforeBoundary.slice(0, -strongDelimiter.length)
      : urlBeforeBoundary,
    node
  );
  const nodes = [
    strongDelimiter ? buildStrong(link) : link,
    ...relinkifyTrailingText(node.url.slice(boundaryIndex)),
  ];
  parent.children.splice(replaceIndex, 1, ...nodes);
  return replaceIndex + nodes.length;
};

/**
 * Remark plugin to split literal autolinks at CJK punctuation boundaries
 * so trailing text is not swallowed by the URL. When trailing text contains
 * further bare URLs (e.g. separated by fullwidth semicolons), those are
 * re-linkified as well.
 */
const remarkCjkAutolinkBoundary: Plugin<[], Root> = () => (tree, file) => {
  const source = file?.toString() ?? "";

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

      return replaceAutolinkAtBoundary(
        node,
        parent,
        index,
        boundaryIndex,
        source
      );
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
