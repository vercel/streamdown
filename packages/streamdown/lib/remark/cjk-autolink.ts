import type { Link, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";
import type { Parent } from "unist";

const CJK_PUNCTUATION = new Set<string>([
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
    if (CJK_PUNCTUATION.has(char)) {
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

export const remarkCjkAutolinkBoundary: Plugin<[], Root> = () => (tree) => {
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

    if (!trimmedUrl || !trailing) {
      return;
    }

    const trimmedLink = buildAutolink(trimmedUrl, node);
    const trailingText = buildTrailingText(trailing);

    parent.children.splice(index, 1, trimmedLink, trailingText);
    return index + 1;
  });
};
