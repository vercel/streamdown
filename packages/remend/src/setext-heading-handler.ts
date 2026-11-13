// Handles incomplete setext heading underlines during streaming
// Setext headings use --- or === on the line below text to create headings
// During streaming, partial list items (like "-") can be misinterpreted as setext heading underlines

// Regex patterns defined at top level for performance
const DASH_ONLY_PATTERN = /^-{1,2}$/;
const DASH_WITH_SPACE_PATTERN = /^[\s]*-{1,2}[\s]+$/;
const EQUALS_ONLY_PATTERN = /^={1,2}$/;
const EQUALS_WITH_SPACE_PATTERN = /^[\s]*={1,2}[\s]+$/;
const LIST_ITEM_PATTERN = /^ {0,3}(?:[-+*]|(\d{1,9})[.)])(?: +|\t)/;
const BLOCKQUOTE_PATTERN = /^ {0,3}>/;
const LEADING_WHITESPACE_PATTERN = /^[ \t]*/;

// Column width of leading whitespace, expanding tabs to the next multiple of 4.
const indentationWidth = (line: string): number => {
  let width = 0;
  for (const char of LEADING_WHITESPACE_PATTERN.exec(line)?.[0] ?? "") {
    width += char === "\t" ? 4 - (width % 4) : 1;
  }
  return width;
};

// An ordered marker other than 1 cannot interrupt a paragraph, so "2. item"
// right after prose is paragraph text rather than a list item. Walk back to
// the start of the ordered run and check what precedes it.
const startsOrderedList = (previousLines: string[]): boolean => {
  for (let index = previousLines.length - 1; index >= 0; index--) {
    const line = previousLines[index];
    const match = LIST_ITEM_PATTERN.exec(line);
    if (match?.[1] === undefined) {
      // Reached the line before the run: only a block boundary or another
      // container lets the run start a list.
      return (
        line.trim().length === 0 ||
        Boolean(match) ||
        BLOCKQUOTE_PATTERN.test(line)
      );
    }
    if (Number(match[1]) === 1) {
      return true;
    }
  }
  return true;
};

// A setext underline cannot be a lazy continuation line. When the previous
// line is a list item or block quote and the dash is not indented into it,
// the dash starts a new list item, so no heading can form.
const isOutsidePreviousContainer = (
  previousLine: string,
  lastLine: string,
  previousLines: string[]
): boolean => {
  const listItem = LIST_ITEM_PATTERN.exec(previousLine);
  if (listItem) {
    if (listItem[1] !== undefined && !startsOrderedList(previousLines)) {
      return false;
    }
    return indentationWidth(lastLine) < listItem[0].length;
  }
  return BLOCKQUOTE_PATTERN.test(previousLine);
};

/**
 * Detects if the text ends with a potential incomplete setext heading underline
 * and adds a space to break the setext heading pattern
 */
export const handleIncompleteSetextHeading = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Find the last line of the text
  const lastNewlineIndex = text.lastIndexOf("\n");

  // If there's no newline, we can't have a setext heading
  if (lastNewlineIndex === -1) {
    return text;
  }

  const lastLine = text.substring(lastNewlineIndex + 1);
  const previousContent = text.substring(0, lastNewlineIndex);

  // Check if last line is only dashes or equals (potential setext heading underline)
  // We need to check for patterns like: "-", "--", "=", "=="
  // But NOT "---" or "===" (which are valid horizontal rules / setext headings)

  // Trim to check the actual content
  const trimmedLastLine = lastLine.trim();

  // Check if it's ONLY dashes (1 or 2) - but if there's trailing space, don't modify
  // If the last line ends with space after the dashes, it's already broken the setext heading pattern
  if (
    DASH_ONLY_PATTERN.test(trimmedLastLine) &&
    !lastLine.match(DASH_WITH_SPACE_PATTERN)
  ) {
    // Check if there's content on the previous line (required for setext heading)
    const lines = previousContent.split("\n");
    const previousLine = lines.at(-1);

    // If the previous line has content, this could be interpreted as a setext heading
    if (
      previousLine &&
      previousLine.trim().length > 0 &&
      !isOutsidePreviousContainer(previousLine, lastLine, lines)
    ) {
      // Add text to break the setext heading pattern
      // We add a zero-width space (\u200B) which breaks the pattern without being visible
      // This is better than adding a regular space which markdown parsers may still interpret
      // as a setext heading underline
      return `${text}\u200B`;
    }
  }

  // Check if it's ONLY equals (1 or 2)
  if (
    EQUALS_ONLY_PATTERN.test(trimmedLastLine) &&
    !lastLine.match(EQUALS_WITH_SPACE_PATTERN)
  ) {
    // Check if there's content on the previous line
    const lines = previousContent.split("\n");
    const previousLine = lines.at(-1);

    if (previousLine && previousLine.trim().length > 0) {
      // Add text to break the setext heading pattern
      // We add a zero-width space (\u200B) which breaks the pattern without being visible
      return `${text}\u200B`;
    }
  }

  return text;
};
