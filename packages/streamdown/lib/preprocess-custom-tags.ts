/**
 * Preprocesses markdown so custom tags can act as markdown containers.
 *
 * CommonMark HTML-block rules are the constraint:
 *
 * 1. **Same-line content** (`<tag>**bold**</tag>`) is left alone. The parser
 *    treats the tag as inline HTML inside a paragraph, so nested markdown still
 *    runs as phrasing content.
 *
 * 2. **Multi-line content** must interrupt the HTML block for nested markdown
 *    to parse. HTML blocks end at a blank line, the same shape used by
 *    containers like `<details>`:
 *
 *        <tag>
 *
 *        **bold** and lists work here
 *
 *        </tag>
 *
 *    This function normalizes multi-line custom tags into that shape: a blank
 *    line after the opening tag and before the closing tag (with a trailing
 *    blank line so later markdown is not absorbed).
 *
 * 3. **Internal blank lines** are replaced with HTML comments (`<!---->`) so
 *    that, if the block is ever treated as a contiguous HTML unit (e.g. by a
 *    lexer that has not yet seen the blank-line interrupt), the tag is not
 *    split across tokens. Empty comments are invisible once nested markdown
 *    is parsing between the open/close tags.
 *
 * 4. **Streaming / unclosed tags**: while the close tag has not arrived yet,
 *    the same blank-line interruption is applied after the opening tag so
 *    nested markdown can parse incrementally. Without this, incomplete tags
 *    stay a single raw HTML block and `**bold**` renders as literal text.
 *
 * `parseMarkdownIntoBlocks` re-merges the interrupted open/content/close
 * tokens so streaming still treats the whole custom tag as one block.
 */

const LEADING_NEWLINES_RE = /^\n*/;
const TRAILING_NEWLINES_RE = /\n*$/;
const BLANK_LINE_RE = /\n\n/g;

const normalizeClosedTag = (
  open: string,
  content: string,
  close: string
): string => {
  // Inline/same-line tags keep working as phrasing content.
  if (!content.includes("\n")) {
    return open + content + close;
  }

  // Preserve blank-line placeholders so the tag cannot be silently split
  // if any consumer still treats the body as raw HTML text.
  const fixedContent = content.replace(BLANK_LINE_RE, "\n<!---->\n");

  // Blank-line sandwich: interrupt the HTML block after open / before close
  // so nested markdown (emphasis, lists, …) can parse.
  const paddedContent = fixedContent
    .replace(LEADING_NEWLINES_RE, "\n\n")
    .replace(TRAILING_NEWLINES_RE, "\n\n");

  // Trailing blank line after the close tag ends the HTML block so
  // subsequent markdown (headings, paragraphs, etc.) is not absorbed.
  return `${open}${paddedContent}${close}\n\n`;
};

/**
 * For unclosed opening tags (still streaming), ensure a blank line follows
 * the open tag when body content has started on a later line. That ends the
 * HTML block so the body can parse as markdown before the close tag arrives.
 * Internal blank lines are also replaced with `<!---->` for consistency.
 */
const normalizeUnclosedOpenTags = (
  markdown: string,
  tagName: string
): string => {
  const openOnly = new RegExp(`<(${tagName})(?=[\\s>/])([^>]*)>`, "gi");

  let result = "";
  let lastIndex = 0;
  let match = openOnly.exec(markdown);

  while (match) {
    const fullOpen = match[0];
    const name = match[1];
    const openEnd = match.index + fullOpen.length;
    const after = markdown.slice(openEnd);

    // Skip if a matching close tag exists later — closed-pair pass owns it.
    const closeRe = new RegExp(`</${name}\\s*>`, "i");
    if (closeRe.test(after)) {
      match = openOnly.exec(markdown);
      continue;
    }

    result += markdown.slice(lastIndex, match.index);

    // Already blank-line interrupted, or no body yet — leave the interrupt
    // intact, but still normalize further blank lines inside the body.
    if (after.length === 0) {
      result += fullOpen;
      lastIndex = openEnd;
      match = openOnly.exec(markdown);
      continue;
    }
    if (after.startsWith("\n\n")) {
      // Keep the leading "\n\n" interrupt; replace only subsequent blanks.
      const body = after.slice(2).replace(BLANK_LINE_RE, "\n<!---->\n");
      result += `${fullOpen}\n\n${body}`;
      lastIndex = markdown.length;
      break;
    }

    // Body on same line as open (inline incomplete) — leave as-is so
    // phrasing content can still bold once complete.
    if (!after.startsWith("\n")) {
      result += fullOpen;
      lastIndex = openEnd;
      match = openOnly.exec(markdown);
      continue;
    }

    // Open + newline but no real body yet (still waiting for first chars).
    const bodyAfterNewline = after.slice(1);
    if (bodyAfterNewline.trim().length === 0) {
      result += fullOpen;
      lastIndex = openEnd;
      match = openOnly.exec(markdown);
      continue;
    }

    // Multi-line body without blank after open: insert blank line and
    // replace internal blank lines with HTML comments.
    const fixedBody = bodyAfterNewline.replace(BLANK_LINE_RE, "\n<!---->\n");
    result += `${fullOpen}\n\n${fixedBody}`;
    lastIndex = markdown.length;
    break;
  }

  if (lastIndex === 0) {
    return markdown;
  }

  return result + markdown.slice(lastIndex);
};

export const preprocessCustomTags = (
  markdown: string,
  tagNames: string[]
): string => {
  if (!tagNames.length) {
    return markdown;
  }

  let result = markdown;

  for (const tagName of tagNames) {
    const closedPattern = new RegExp(
      `(<${tagName}(?=[\\s>/])[^>]*>)([\\s\\S]*?)(</${tagName}\\s*>)`,
      "gi"
    );

    result = result.replace(
      closedPattern,
      (_match, open: string, content: string, close: string) =>
        normalizeClosedTag(open, content, close)
    );

    result = normalizeUnclosedOpenTags(result, tagName);
  }

  return result;
};
