import type { Element, ElementContent, Root, Text } from "hast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Recursively collect all text content from a HAST node subtree.
 */
const collectText = (node: ElementContent): string => {
  if (node.type === "text") {
    return (node as Text).value;
  }
  if ("children" in node && Array.isArray(node.children)) {
    return (node.children as ElementContent[]).map(collectText).join("");
  }
  return "";
};

/**
 * rehype plugin — replaces children of elements whose tag names are in
 * `tagNames` with a single plain-text node. Run this after rehype-raw and
 * rehype-sanitize so the custom elements already exist as proper HAST nodes.
 *
 * Works in tandem with `preprocessLiteralTagContent`, which escapes markdown
 * syntax before remark parses it, ensuring the text value here reflects the
 * original literal content (not stripped markdown markers).
 */
export const rehypeLiteralTagContent: Plugin<[string[]], Root> =
  (tagNames) => (tree: Root) => {
    if (!tagNames || tagNames.length === 0) {
      return;
    }
    const tagSet = new Set(tagNames.map((t) => t.toLowerCase()));

    visit(tree, "element", (node: Element) => {
      if (tagSet.has(node.tagName.toLowerCase())) {
        const text = collectText(node);
        node.children = text ? [{ type: "text", value: text } as Text] : [];
      }
    });
  };
