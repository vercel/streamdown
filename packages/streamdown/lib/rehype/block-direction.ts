import type { Element, Root } from "hast";
import { visit } from "unist-util-visit";
import { detectTextDirection } from "../detect-direction";

const DIRECTIONAL_BLOCKS = new Set([
  "blockquote",
  "dd",
  "dt",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "p",
  "td",
  "th",
]);

const CODE_ELEMENTS = new Set(["code", "kbd", "pre", "samp", "var"]);

function textContent(node: Element): string {
  return node.children
    .map((child) => {
      if (child.type === "text") {
        return child.value;
      }
      if (child.type === "element" && !CODE_ELEMENTS.has(child.tagName)) {
        return textContent(child);
      }
      return "";
    })
    .join("");
}

/**
 * Assign direction to each rendered semantic block without splitting the
 * Markdown document, so references and footnotes continue to resolve across
 * block boundaries.
 */
export function rehypeBlockDirection() {
  return (tree: Root) => {
    visit(tree, "element", (node: Element) => {
      if (CODE_ELEMENTS.has(node.tagName)) {
        node.properties ??= {};
        node.properties.dir = "ltr";
        return;
      }

      if (!DIRECTIONAL_BLOCKS.has(node.tagName)) {
        return;
      }

      node.properties ??= {};
      if (typeof node.properties.dir === "string") {
        return;
      }

      node.properties.dir = detectTextDirection(textContent(node));
    });
  };
}
