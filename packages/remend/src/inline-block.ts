import { isFenceAt, skipContainerPrefix, type TextScan } from "./scan";

const headingPattern = /^#{1,6}(?:[ \t]|$)/;
const thematicBreakPattern =
  /^(?:(?:\*[ \t]*){3,}|(?:-[ \t]*){3,}|(?:_[ \t]*){3,})$/;
const setextUnderlinePattern = /^(?:=+|-+)[ \t]*$/;
// The setext handler's zero-width space after a streaming dash stands in for
// the list item or thematic break that dash usually starts
// A list marker alone on a finished line is an empty item, which ends there
const emptyItemPattern = /^(?:[*+-]|\d{1,9}[.)])$/;
const dashPlaceholderPattern = /^-{1,2}\u200B$/;

/**
 * Index where the text's last inline block starts, since emphasis never
 * pairs across paragraphs, list items, headings, table rows or code blocks
 */
export const findInlineBlockStart = (scan: TextScan): number => {
  const { text } = scan;
  let start = 0;
  let quoteDepth = 0;
  let endsBlock = false;

  for (let lineStart = 0; lineStart <= text.length; ) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = text.length;
    }
    const next = lineEnd + 1;
    const prefix = skipContainerPrefix(text, lineStart, lineEnd);
    const content = text.slice(prefix.contentStart, lineEnd).trim();

    // The unterminated last line is where the paragraph keeps streaming
    if (lineEnd === text.length && content === "") {
      break;
    }
    if (
      content === "" ||
      isFenceAt(scan, prefix.contentStart) ||
      // A list marker walk would read the first star of * * * as an item
      thematicBreakPattern.test(text.slice(lineStart, lineEnd).trim()) ||
      thematicBreakPattern.test(content) ||
      (setextUnderlinePattern.test(content) && !endsBlock) ||
      (lineEnd < text.length && emptyItemPattern.test(content))
    ) {
      start = next;
      endsBlock = false;
    } else if (
      endsBlock ||
      prefix.listIndent > 0 ||
      prefix.quoteDepth > quoteDepth ||
      dashPlaceholderPattern.test(content) ||
      headingPattern.test(content) ||
      content.startsWith("|")
    ) {
      start = prefix.contentStart;
      endsBlock = headingPattern.test(content) || content.startsWith("|");
    }
    quoteDepth = prefix.quoteDepth;
    lineStart = next;
  }

  return Math.min(start, text.length);
};
