import type { Blockquote, Paragraph, Root, Text } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "warning",
  "caution",
]);

const ADMONITION_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/i;

function detectAdmonitionType(node: Blockquote): string | undefined {
  const firstChild = node.children[0];
  if (!firstChild || firstChild.type !== "paragraph") {
    return undefined;
  }

  const paragraph = firstChild as Paragraph;
  const firstInline = paragraph.children[0];
  if (!firstInline || firstInline.type !== "text") {
    return undefined;
  }

  const textNode = firstInline as Text;
  const match = textNode.value.match(ADMONITION_REGEX);
  if (!match) {
    return undefined;
  }

  const type = match[1].toLowerCase();
  if (!ADMONITION_TYPES.has(type)) {
    return undefined;
  }

  return type;
}

function stripMarker(node: Blockquote): void {
  const paragraph = node.children[0] as Paragraph;
  const textNode = paragraph.children[0] as Text;
  const match = textNode.value.match(ADMONITION_REGEX);
  if (!match) {
    return;
  }

  const remaining = textNode.value.slice(match[0].length);

  if (remaining.length > 0) {
    textNode.value = remaining;
  } else if (paragraph.children.length > 1) {
    paragraph.children.splice(0, 1);
  } else {
    node.children.splice(0, 1);
  }
}

export const remarkAdmonition: Plugin<[], Root> = () => (tree) => {
  visit(tree, "blockquote", (node: Blockquote) => {
    const type = detectAdmonitionType(node);
    if (!type) {
      return;
    }

    stripMarker(node);

    node.data = node.data ?? {};
    node.data.hName = "admonition";
    node.data.hProperties = {
      ...((node.data.hProperties as Record<string, unknown>) ?? {}),
      "data-admonition-type": type,
      dataAdmonitionType: type,
    };
  });
};
