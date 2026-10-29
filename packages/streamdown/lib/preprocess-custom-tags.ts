/**
 * Preprocesses markdown so custom tags can act as markdown containers.
 *
 * CommonMark HTML-block rules are the constraint:
 *
 * 1. **Same-line content** (`<tag>**bold**</tag>`) is left alone. The parser
 *    treats the tag as inline HTML inside a paragraph, so nested markdown still
 *    runs as phrasing content. So is a tag that follows text on its line
 *    (`Note: <tag>a\nb</tag>`): padding it would end the paragraph after the
 *    opening tag and leave the tag empty. Self-closing tags (`<tag />`) are
 *    left alone too.
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
 *    This function normalizes multi-line custom tags that start their line
 *    into that shape: a blank line after the opening tag and before the
 *    closing tag (with a trailing blank line so later markdown is not
 *    absorbed).
 *
 * 3. **Internal blank lines** are replaced with HTML comments (`<!---->`) so
 *    that, if the block is ever treated as a contiguous HTML unit (e.g. by a
 *    lexer that has not yet seen the blank-line interrupt), the tag is not
 *    split across tokens. Empty comments are invisible once nested markdown
 *    is parsing between the open/close tags.
 *
 * 4. **Streaming / unclosed tags**: while the close tag has not arrived yet,
 *    the same blank-line interruption is applied after an opening tag that
 *    starts its line, so nested markdown can parse incrementally. Without
 *    this, incomplete tags stay a single raw HTML block and `**bold**` renders
 *    as literal text.
 *
 * `parseMarkdownIntoBlocks` re-merges the interrupted open/content/close
 * tokens so streaming still treats the whole custom tag as one block.
 */

const LEADING_NEWLINES_RE = /^\n*/;
const TRAILING_NEWLINES_RE = /\n*$/;
const BLANK_LINE_RE = /\n\n/g;
const FENCE_RE = /^[ \t]*(`{3,}|~{3,})(.*)$/;

// An opening tag that is not self-closing: matches `<tag>` and `<tag a="b">`,
// not `<tag />`.
const openTagSource = (tagName: string): string =>
  `<${tagName}(?=[\\s>/])(?:[^>]*[^>/])?>`;

// What may precede a tag that starts a block on its line: indentation, list
// or blockquote markers, and closing tags (usually the end of a padded
// container, which is followed by a blank line).
const BLOCK_PREFIX_RE =
  /^[ \t]*(?:(?:[*+-]|\d{1,9}[.)])[ \t]+|>[ \t]*|<\/[A-Za-z][^<>]*>[ \t]*)*$/;

/**
 * Returns a check for whether the tag at an index of `markdown` follows text
 * on its line, which makes it inline HTML rather than a container. Indexes
 * must not decrease between calls, so each line is scanned once.
 */
const createFollowsText = (markdown: string) => {
  // remark drops a byte order mark at the start of the document.
  let lineStart = markdown.startsWith("\uFEFF") ? 1 : 0;
  let nextNewline = markdown.indexOf("\n");
  let checkedLineStart = -1;

  return (index: number): boolean => {
    while (nextNewline !== -1 && nextNewline < index) {
      lineStart = nextNewline + 1;
      nextNewline = markdown.indexOf("\n", lineStart);
    }
    // A later tag on the same line follows the earlier opening tag, so only
    // the first tag of a line can start a block.
    if (lineStart === checkedLineStart) {
      return true;
    }
    checkedLineStart = lineStart;
    return !BLOCK_PREFIX_RE.test(markdown.slice(lineStart, index));
  };
};

/**
 * Replaces blank lines with `<!---->` placeholders, except inside fenced code
 * blocks. A comment inside a fence is not markup, it is literal code text, so
 * it would show up in the rendered code. Blank lines inside a fence cannot end
 * the surrounding HTML block anyway.
 */
const replaceBlankLines = (text: string): string => {
  if (!(text.includes("```") || text.includes("~~~"))) {
    return text.replace(BLANK_LINE_RE, "\n<!---->\n");
  }

  let result = "";
  let segmentStart = 0;
  let fenceChar: string | null = null;
  let fenceLength = 0;
  let lineStart = 0;

  while (lineStart <= text.length) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = text.length;
    }
    const match = FENCE_RE.exec(text.slice(lineStart, lineEnd));

    if (match) {
      const run = match[1];
      const rest = match[2];
      if (fenceChar === null) {
        // A backtick fence's info string cannot contain backticks.
        if (!(run[0] === "`" && rest.includes("`"))) {
          result += text
            .slice(segmentStart, lineStart)
            .replace(BLANK_LINE_RE, "\n<!---->\n");
          segmentStart = lineStart;
          fenceChar = run[0];
          fenceLength = run.length;
        }
      } else if (
        run[0] === fenceChar &&
        run.length >= fenceLength &&
        rest.trim() === ""
      ) {
        result += text.slice(segmentStart, lineEnd);
        segmentStart = lineEnd;
        fenceChar = null;
        fenceLength = 0;
      }
    }

    lineStart = lineEnd + 1;
  }

  const remaining = text.slice(segmentStart);
  return (
    result +
    (fenceChar === null
      ? remaining.replace(BLANK_LINE_RE, "\n<!---->\n")
      : remaining)
  );
};

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
  const fixedContent = replaceBlankLines(content);

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
 * For unclosed opening tags that start their line (still streaming), ensure a
 * blank line follows the open tag when body content has started on a later
 * line. That ends the HTML block so the body can parse as markdown before the
 * close tag arrives. Internal blank lines are also replaced with `<!---->` for
 * consistency.
 */
const normalizeUnclosedOpenTags = (
  markdown: string,
  tagName: string
): string => {
  const openOnly = new RegExp(openTagSource(tagName), "gi");
  const followsText = createFollowsText(markdown);

  let result = "";
  let lastIndex = 0;
  let match = openOnly.exec(markdown);

  while (match) {
    const fullOpen = match[0];
    const openEnd = match.index + fullOpen.length;
    const after = markdown.slice(openEnd);

    // A tag that follows text on its line is inline HTML, not a streaming
    // container.
    if (followsText(match.index)) {
      match = openOnly.exec(markdown);
      continue;
    }

    // Skip if a matching close tag exists later — closed-pair pass owns it.
    const closeRe = new RegExp(`</${tagName}\\s*>`, "i");
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
      const body = replaceBlankLines(after.slice(2));
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
    const fixedBody = replaceBlankLines(bodyAfterNewline);
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
      `(${openTagSource(tagName)})([\\s\\S]*?)(</${tagName}\\s*>)`,
      "gi"
    );

    const followsText = createFollowsText(result);
    result = result.replace(
      closedPattern,
      (
        match: string,
        open: string,
        content: string,
        close: string,
        offset: number
      ) =>
        followsText(offset) ? match : normalizeClosedTag(open, content, close)
    );

    result = normalizeUnclosedOpenTags(result, tagName);
  }

  return result;
};
