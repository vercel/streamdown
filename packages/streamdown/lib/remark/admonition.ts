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

export const remarkAdmonition: Plugin<[], Root> = () => (tree) => {
  visit(tree, "blockquote", (node: Blockquote) => {
    const firstChild = node.children[0];
    if (!firstChild || firstChild.type !== "paragraph") {
      return;
    }

    const paragraph = firstChild as Paragraph;
    const firstInline = paragraph.children[0];
    if (!firstInline || firstInline.type !== "text") {
      return;
    }

    const textNode = firstInline as Text;
    const match = textNode.value.match(ADMONITION_REGEX);
    if (!match) {
      return;
    }

    const type = match[1].toLowerCase();
    if (!ADMONITION_TYPES.has(type)) {
      return;
    }

    // Strip the [!TYPE] marker from the text
    const remaining = textNode.value.slice(match[0].length);

    if (remaining.length > 0) {
      // There's text after the marker — keep it
      textNode.value = remaining;
    } else if (paragraph.children.length > 1) {
      // Remove the empty text node, keep other paragraph children
      paragraph.children.splice(0, 1);
    } else {
      // Paragraph only had the marker — remove entire paragraph
      node.children.splice(0, 1);
    }

    // Transform blockquote into admonition via remark-rehype hName/hProperties
    node.data = node.data ?? {};
    node.data.hName = "admonition";
    node.data.hProperties = {
      ...((node.data.hProperties as Record<string, unknown>) ?? {}),
      "data-admonition-type": type,
      dataAdmonitionType: type,
    };
  });
};
