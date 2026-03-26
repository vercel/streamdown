/**
 * Preprocesses markdown to prevent custom tag blocks from being broken apart
 * by the CommonMark parser. Two issues are addressed:
 *
 * 1. **Inline content after opening tag**: In CommonMark, HTML block types 6/7
 *    require the opening tag to start a line on its own (or be followed only by
 *    whitespace). When content appears on the same line as the opening tag
 *    (e.g. `<custom>content`), the parser treats it as inline HTML inside a
 *    paragraph instead of an HTML block, causing the tag to lose its structure.
 *    This function ensures the opening tag, content, and closing tag each
 *    occupy their own lines.
 *
 * 2. **Blank lines inside tag content**: HTML blocks end at blank lines, which
 *    causes custom tags with blank lines in their content to be split across
 *    multiple tokens. This function replaces blank lines within matched custom
 *    tag pairs with HTML comments (`<!---->`), so the markdown parser treats
 *    the entire tag block as a single unit.
 */
export const preprocessCustomTags = (
  markdown: string,
  tagNames: string[]
): string => {
  if (!tagNames.length) {
    return markdown;
  }

  let result = markdown;

  for (const tagName of tagNames) {
    const pattern = new RegExp(
      `(<${tagName}(?=[\\s>/])[^>]*>)([\\s\\S]*?)(</${tagName}\\s*>)`,
      "gi"
    );

    result = result.replace(
      pattern,
      (_match, open: string, content: string, close: string) => {
        // Restructure when:
        // 1. Content has blank lines (\n\n) — these would split the HTML block, or
        // 2. Content starts inline (not preceded by \n) and contains any newline —
        //    a newline inside inline content can introduce block-level elements like
        //    ATX headings (# title) that the parser would treat as a new block,
        //    prematurely terminating the custom tag scope.
        const hasBlankLines = content.includes("\n\n");
        const isInlineContent = !content.startsWith("\n");
        const hasNewline = content.includes("\n");
        if (!(hasBlankLines || (isInlineContent && hasNewline))) {
          return open + content + close;
        }

        const fixedContent = content.replace(/\n\n/g, "\n<!---->\n");

        // Ensure content is on its own lines so the parser recognises an
        // HTML block (type 7) rather than inline HTML in a paragraph.
        const paddedContent =
          (fixedContent.startsWith("\n") ? "" : "\n") +
          fixedContent +
          (fixedContent.endsWith("\n") ? "" : "\n");

        // A blank line after the close tag terminates the HTML block so
        // subsequent markdown (headings, paragraphs, etc.) is not absorbed.
        return `${open}${paddedContent}${close}\n\n`;
      }
    );
  }

  return result;
};
