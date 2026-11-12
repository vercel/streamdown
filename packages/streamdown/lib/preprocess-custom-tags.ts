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
 *    This function normalizes multi-line custom tags that start a block (see
 *    createStartsBlock) into that shape: a blank line after the opening tag
 *    and before the closing tag (with a trailing blank line so later markdown
 *    is not absorbed).
 *
 * 3. **Internal blank lines** are replaced with HTML comments (`<!---->`) so
 *    that, if the block is ever treated as a contiguous HTML unit (e.g. by a
 *    lexer that has not yet seen the blank-line interrupt), the tag is not
 *    split across tokens. Empty comments are invisible once nested markdown
 *    is parsing between the open/close tags.
 *
 * 4. **Streaming / unclosed tags**: while the close tag has not arrived yet,
 *    the same blank-line interruption is applied after an opening tag that
 *    starts a block, so nested markdown can parse incrementally. Without
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
const REGEXP_METACHAR_RE = /[.*+?^${}()|[\]\\]/g;

const escapeRegExp = (value: string): string =>
  value.replace(REGEXP_METACHAR_RE, "\\$&");

// An opening tag that is not self-closing: matches `<tag>` and `<tag a="b">`,
// not `<tag />`.
const openTagSource = (tagName: string): string =>
  `<${escapeRegExp(tagName)}(?=[\\s>/])(?:[^>]*[^>/])?>`;

// A run that a tag may follow at the start of its line, or after the closing
// tag of a padded container, and still start a block: indentation, list or
// blockquote markers, and closing tags.
const BLOCK_PREFIX_RE =
  /[ \t]*(?:(?:[*+-]|\d{1,9}[.)])[ \t]+|>[ \t]*|<\/[A-Za-z][^<>\n]*>[ \t]*)*/y;

// Index of the last number in ascending `sorted` that is at most `value`.
const findLastAtMost = (sorted: number[], value: number): number => {
  let low = -1;
  let high = sorted.length - 1;
  while (low < high) {
    const mid = Math.ceil((low + high) / 2);
    if (sorted[mid] <= value) {
      low = mid;
    } else {
      high = mid - 1;
    }
  }
  return low;
};

// An allowed tag pair with a multi-line body, as offsets into the markdown.
interface Container {
  children: Container[];
  closeEnd: number;
  closeStart: number;
  open: number;
  openEnd: number;
  // Whether the opening tag starts a block, so the pair gets padded.
  padded: boolean;
}

const SELF_CLOSING_END_RE = /\/\s*>$/;
const TAG_NAME_RE = /^<([A-Za-z][\w:-]*)/;

// Every allowed pair with a multi-line body, in document order with an outer
// pair before the pairs it contains. One scan pairs each closing tag with the
// nearest unmatched opening tag of the same name, so an outer tag is not
// stopped at an inner tag's closing tag. Matching each tag name on its own
// does that, and then which pairs are seen depends on the allowedTags order.
const multilinePairs = (markdown: string, tagNames: string[]): Container[] => {
  const boundary = new RegExp(
    `<(/?)(${tagNames.map(escapeRegExp).join("|")})(?=[\\s>/])[^>]*>`,
    "gi"
  );
  const pairs: Container[] = [];
  const openStack: { name: string; index: number; end: number }[] = [];

  for (const match of markdown.matchAll(boundary)) {
    const name = match[2].toLowerCase();
    const isClose = match[1] === "/";
    const end = match.index + match[0].length;
    const isSelfClosing = !isClose && SELF_CLOSING_END_RE.test(match[0]);
    if (isSelfClosing) {
      continue;
    }
    if (!isClose) {
      openStack.push({ name, index: match.index, end });
      continue;
    }
    for (let i = openStack.length - 1; i >= 0; i -= 1) {
      if (openStack[i].name !== name) {
        continue;
      }
      const { index: open, end: openEnd } = openStack[i];
      openStack.splice(i, 1);
      const newline = markdown.indexOf("\n", open);
      if (newline !== -1 && newline < match.index) {
        pairs.push({
          open,
          openEnd,
          closeStart: match.index,
          closeEnd: end,
          children: [],
          padded: false,
        });
      }
      break;
    }
  }

  return pairs.sort((a, b) => a.open - b.open || b.closeEnd - a.closeEnd);
};

const createLineScanner = (markdown: string) => {
  const prefixEnds = new Map<number, number>();
  let lineStarts: number[] | undefined;

  const lineStartOf = (index: number): number => {
    if (!lineStarts) {
      // remark drops a byte order mark at the start of the document.
      lineStarts = [markdown.startsWith("\uFEFF") ? 1 : 0];
      for (
        let newline = markdown.indexOf("\n");
        newline !== -1;
        newline = markdown.indexOf("\n", newline + 1)
      ) {
        lineStarts.push(newline + 1);
      }
    }
    return lineStarts[findLastAtMost(lineStarts, index)];
  };

  // Where the block prefix run that begins at `start` ends.
  const prefixEnd = (start: number): number => {
    let end = prefixEnds.get(start);
    if (end === undefined) {
      BLOCK_PREFIX_RE.lastIndex = start;
      end = start + (BLOCK_PREFIX_RE.exec(markdown)?.[0].length ?? 0);
      prefixEnds.set(start, end);
    }
    return end;
  };

  /**
   * Whether the tag at `index` starts a block. It does when only a block
   * prefix run (see BLOCK_PREFIX_RE) precedes it on its line, or separates it
   * from the closing tag of a padded container: padding puts a blank line
   * after that closing tag. `paddedEnd` is the nearest padded closing tag end
   * at or before `index`; a padded close further back would have to reach the
   * tag through it, so it settles the second case. Otherwise the tag follows
   * text, which makes it inline HTML rather than a container.
   */
  const startsBlock = (index: number, paddedEnd: number): boolean => {
    const lineStart = lineStartOf(index);
    return (
      prefixEnd(lineStart) === index ||
      (paddedEnd > lineStart && prefixEnd(paddedEnd) === index)
    );
  };

  return startsBlock;
};

/**
 * Builds the tree of multi-line containers and decides which are padded. A
 * container only depends on containers that close before it opens, and those
 * are already decided when containers are visited in document order. A pair
 * that crosses an open container (`<a>\n<b>\n</a>\n</b>`) cannot nest, so it
 * is left as is.
 */
const parseContainers = (markdown: string, tagNames: string[]) => {
  const startsBlock = createLineScanner(markdown);
  const roots: Container[] = [];
  const stack: Container[] = [];
  const paddedEnds: number[] = [];
  let paddedEnd = -1;

  const close = (container: Container) => {
    if (container.padded) {
      paddedEnds.push(container.closeEnd);
      paddedEnd = Math.max(paddedEnd, container.closeEnd);
    }
  };

  for (const pair of multilinePairs(markdown, tagNames)) {
    let parent = stack.at(-1);
    while (parent && parent.closeEnd <= pair.open) {
      close(parent);
      stack.pop();
      parent = stack.at(-1);
    }
    if (parent && pair.closeEnd > parent.closeStart) {
      continue;
    }
    pair.padded = startsBlock(pair.open, paddedEnd);
    (parent ? parent.children : roots).push(pair);
    stack.push(pair);
  }
  for (const container of stack) {
    close(container);
  }
  paddedEnds.sort((a, b) => a - b);

  return {
    roots,
    startsBlock: (index: number): boolean => {
      const i = findLastAtMost(paddedEnds, index);
      return startsBlock(index, i === -1 ? -1 : paddedEnds[i]);
    },
  };
};

/**
 * Replaces blank lines with `<!---->` placeholders, except inside fenced code
 * blocks. A comment inside a fence is not markup, it is literal code text, so
 * it would show up in the rendered code. Blank lines inside a fence cannot end
 * the surrounding HTML block anyway.
 */
// A nested tag padded before its parent already has the blank lines this
// replacement would add. Mark a doubled newline that follows or precedes a tag
// so only the parent's own blank lines become placeholders.
const ALREADY_PADDED_RE = /(?<=<[^<>\n]*>)\n\n|\n\n(?=<)/g;

const replaceBlankLines = (text: string): string => {
  const protect = (value: string): string =>
    value.replace(ALREADY_PADDED_RE, (run) => run.replace("\n\n", "\n\0"));
  const restore = (value: string): string => value.replaceAll("\0", "\n");

  if (!(text.includes("```") || text.includes("~~~"))) {
    return restore(protect(text).replace(BLANK_LINE_RE, "\n<!---->\n"));
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
          result += restore(
            protect(text.slice(segmentStart, lineStart)).replace(
              BLANK_LINE_RE,
              "\n<!---->\n"
            )
          );
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
      ? restore(protect(remaining).replace(BLANK_LINE_RE, "\n<!---->\n"))
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
 * For unclosed opening tags that start a block (still streaming), ensure a
 * blank line follows the open tag when body content has started on a later
 * line. That ends the HTML block so the body can parse as markdown before the
 * close tag arrives. Internal blank lines are also replaced with `<!---->` for
 * consistency.
 */
const normalizeUnclosedOpenTags = (
  markdown: string,
  tagNames: string[]
): string => {
  const openOnly = new RegExp(tagNames.map(openTagSource).join("|"), "gi");
  let startsBlock: ((index: number) => boolean) | undefined;

  let result = "";
  let lastIndex = 0;
  let match = openOnly.exec(markdown);

  while (match) {
    const fullOpen = match[0];
    const openEnd = match.index + fullOpen.length;
    const after = markdown.slice(openEnd);

    // A tag that follows text on its line is inline HTML, not a streaming
    // container.
    startsBlock ??= parseContainers(markdown, tagNames).startsBlock;
    if (!startsBlock(match.index)) {
      match = openOnly.exec(markdown);
      continue;
    }

    // The tag's own close tag, not any allowed one. A nested tag whose
    // container is still unclosed has no close of its own and still needs the
    // interrupt; checking any close skips it.
    const name = TAG_NAME_RE.exec(fullOpen)?.[1] ?? "";
    if (new RegExp(`</${escapeRegExp(name)}\\s*>`, "i").test(after)) {
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

    // Multi-line body without blank after open: insert blank line and keep
    // scanning. A nested tag starts after this one and needs its own interrupt;
    // stopping here leaves it unpadded.
    result += `${fullOpen}\n\n`;
    lastIndex = openEnd + 1;
    openOnly.lastIndex = lastIndex;
    match = openOnly.exec(markdown);
  }

  if (lastIndex === 0) {
    return markdown;
  }

  return result + replaceBlankLines(markdown.slice(lastIndex));
};

// Pad a range, and the containers nested inside it. Children are padded first,
// so the text a container reads as its body already contains their padding.
const padRange = (
  markdown: string,
  from: number,
  to: number,
  containers: Container[]
): string => {
  let result = "";
  let cursor = from;
  for (const container of containers) {
    const { open, openEnd, closeStart, closeEnd } = container;
    const openTag = markdown.slice(open, openEnd);
    const closeTag = markdown.slice(closeStart, closeEnd);
    const inner = padRange(markdown, openEnd, closeStart, container.children);
    result +=
      markdown.slice(cursor, open) +
      (container.padded
        ? normalizeClosedTag(openTag, inner, closeTag)
        : openTag + inner + closeTag);
    cursor = closeEnd;
  }
  return result + markdown.slice(cursor, to);
};

const normalizeClosedTags = (markdown: string, tagNames: string[]): string => {
  const { roots } = parseContainers(markdown, tagNames);
  if (!roots.length) {
    return markdown;
  }
  return padRange(markdown, 0, markdown.length, roots);
};

export const preprocessCustomTags = (
  markdown: string,
  tagNames: string[]
): string => {
  if (!tagNames.length) {
    return markdown;
  }

  return normalizeUnclosedOpenTags(
    normalizeClosedTags(markdown, tagNames),
    tagNames
  );
};
