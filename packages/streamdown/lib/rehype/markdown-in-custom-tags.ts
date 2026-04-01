/**
 * rehype plugin — re-parses text content of custom tag elements as Markdown.
 *
 * When a custom tag contains multiline content (e.g. `<ai-thinking>\n**bold**</ai-thinking>`),
 * the CommonMark parser treats the entire block as an HTML block, passing the
 * inner content through as raw text rather than parsing it as Markdown. This
 * plugin corrects that by finding affected elements and replacing their
 * text-only children with a proper Markdown-parsed HAST subtree.
 *
 * Runs after rehype-raw and rehype-sanitize so that custom elements already
 * exist as proper HAST nodes. Must NOT be applied to tags listed in
 * `literalTagContent` (those intentionally suppress Markdown parsing).
 */

import type { Element, ElementContent, Root } from "hast";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import type { Plugin } from "unified";
import { unified } from "unified";
import { visit } from "unist-util-visit";

/** Returns true when every child of the element is a text or comment node. */
const hasOnlyTextChildren = (node: Element): boolean =>
  node.children.every(
    (child) => child.type === "text" || child.type === "comment"
  );

/** Collect raw text from an element's text/comment children. */
const collectRawText = (node: Element): string =>
  node.children
    .map((child) =>
      child.type === "text"
        ? (child as { type: "text"; value: string }).value
        : ""
    )
    .join("");

/**
 * Re-parse `markdown` text as a Markdown HAST subtree, stripping the root
 * wrapper so the children can be spliced directly into the parent element.
 */
const parseMarkdownToHast = (markdown: string): ElementContent[] => {
  const processor = unified()
    .use(remarkParse)
    .use(remarkRehype, { allowDangerousHtml: true });

  const mdast = processor.parse(markdown);
  // runSync transforms mdast → hast
  const hast = processor.runSync(mdast) as Root;
  return hast.children as ElementContent[];
};

export const rehypeMarkdownInCustomTags: Plugin<[string[], string[]?], Root> =
  (tagNames, literalTagNames = []) =>
  (tree: Root) => {
    if (!tagNames || tagNames.length === 0) {
      return;
    }
    const tagSet = new Set(tagNames.map((t) => t.toLowerCase()));
    const literalSet = new Set(
      (literalTagNames ?? []).map((t) => t.toLowerCase())
    );

    visit(tree, "element", (node: Element) => {
      const tag = node.tagName.toLowerCase();
      if (!tagSet.has(tag) || literalSet.has(tag)) {
        return;
      }

      // Only act when the element has text-only children that look like they
      // contain unparsed Markdown (i.e., the content came through as an HTML
      // block and was not Markdown-parsed by remark).
      if (!hasOnlyTextChildren(node)) {
        return;
      }

      const rawText = collectRawText(node);

      // Skip if no newlines — single-line content is already parsed inline.
      if (!rawText.includes("\n")) {
        return;
      }

      // Re-parse the raw text as Markdown and replace the element's children.
      const parsed = parseMarkdownToHast(rawText);
      node.children = parsed;
    });
  };
