import { isInsideCodeBlock } from "./code-block-utils";
import { findInlineBlockStart } from "./inline-block";
import { handleIncompleteInlineCode } from "./inline-code-handler";
import { getScan, isCompleteSpanAt, isFenceAt, type TextScan } from "./scan";
import { findMatchingOpeningBracket } from "./utils";

export type LinkMode = "protocol" | "text-only";

// Sentinel src for incomplete images during streaming. Mirrors
// streamdown:incomplete-link for incomplete links. Streamdown allowlists the
// `streamdown` protocol for img src in its sanitize schema so this marker
// survives rehype-sanitize + rehype-harden under default config (same as links).
export const INCOMPLETE_IMAGE_PLACEHOLDER = "streamdown:incomplete-image";

// Real URLs stay far below this. Past it we fall back to "any ) closes the
// link", which keeps every scan bounded however adversarial the input is.
const MAX_DESTINATION_SCAN = 2048;

// Scan results that aren't positions
const OPEN = -1; // ran out of text: the link may still be streaming
const INVALID = -2; // not a link destination per CommonMark

const isSpace = (char: string | undefined): boolean =>
  char === " " || char === "\t" || char === "\n" || char === "\r";

const skipSpaces = (text: string, i: number, limit: number): number => {
  let j = i;
  while (j < limit && isSpace(text[j])) {
    j += 1;
  }
  return j;
};

// Index just past a <...> destination starting at i, OPEN or INVALID
const scanAngleDestination = (
  text: string,
  i: number,
  limit: number
): number => {
  let j = i + 1;
  while (j < limit && text[j] !== ">") {
    if (text[j] === "\n" || text[j] === "<") {
      return INVALID;
    }
    j += text[j] === "\\" ? 2 : 1;
  }
  return j < limit ? j + 1 : OPEN;
};

// Scans a destination without <...>, where parentheses must be balanced or
// escaped. `closes` is true when an unmatched ")" ends the link right there.
const scanBareDestination = (
  text: string,
  i: number,
  limit: number
): { end: number; closes: boolean } => {
  let depth = 0;
  let j = i;
  while (j < limit && !isSpace(text[j])) {
    if (text[j] === "\\") {
      j += 2;
      continue;
    }
    if (text[j] === "(") {
      depth += 1;
    } else if (text[j] === ")") {
      if (depth === 0) {
        return { end: j, closes: true };
      }
      depth -= 1;
    }
    j += 1;
  }
  return { end: j, closes: false };
};

const TITLE_CLOSERS: Record<string, string> = { '"': '"', "'": "'", "(": ")" };

// Index just past a "...", '...' or (...) title starting at i, OPEN or INVALID
const scanTitle = (text: string, i: number, limit: number): number => {
  const closer = TITLE_CLOSERS[text[i]];
  if (!closer) {
    return INVALID;
  }
  let j = i + 1;
  while (j < limit && text[j] !== closer) {
    j += text[j] === "\\" ? 2 : 1;
  }
  return j < limit ? j + 1 : OPEN;
};

// Where the link whose "(" is at `open` ends, following CommonMark's inline
// link rules: the destination may contain balanced or backslash-escaped
// parentheses, or anything inside <...>, and an optional title may sit before
// the closing ")". Returns -1 while the link is still open. Text that can't be
// a link destination, or a scan cut short by the cap, falls back to the first
// ")", as before.
export const findLinkClose = (text: string, open: number): number => {
  const limit = Math.min(text.length, open + 1 + MAX_DESTINATION_SCAN);
  const settle = (result: number): number =>
    result === OPEN && limit === text.length ? -1 : text.indexOf(")", open + 1);

  let i = skipSpaces(text, open + 1, limit);
  if (text[i] === "<") {
    const next = scanAngleDestination(text, i, limit);
    if (next < 0) {
      return settle(next);
    }
    i = next;
  } else {
    const destination = scanBareDestination(text, i, limit);
    if (destination.closes) {
      return destination.end;
    }
    i = destination.end;
  }

  i = skipSpaces(text, i, limit);
  if (i >= limit) {
    return settle(OPEN);
  }
  if (text[i] === ")") {
    return i;
  }
  const afterTitle = scanTitle(text, i, limit);
  if (afterTitle < 0) {
    return settle(afterTitle);
  }
  i = skipSpaces(text, afterTitle, limit);
  if (i >= limit) {
    return settle(OPEN);
  }
  return text[i] === ")" ? i : settle(INVALID);
};

// Helper function to handle incomplete URLs in links/images
const handleIncompleteUrl = (
  text: string,
  lastParenIndex: number,
  linkMode: LinkMode,
  blockStart: number
): string | null => {
  if (findLinkClose(text, lastParenIndex + 1) !== -1) {
    return null;
  }

  // We have an incomplete URL like [text](partial-url
  // Now find the matching opening bracket for the ] before (
  const openBracketIndex = findMatchingOpeningBracket(text, lastParenIndex);

  // The link text must start in the same block as its "]("
  if (
    openBracketIndex < blockStart ||
    isInsideCodeBlock(text, openBracketIndex)
  ) {
    return null;
  }

  // Check if there's a ! before the [
  const isImage = openBracketIndex > 0 && text[openBracketIndex - 1] === "!";
  const startIndex = isImage ? openBracketIndex - 1 : openBracketIndex;

  // Extract everything before this link/image
  const beforeLink = text.substring(0, startIndex);

  // Extract the text between [ and ] (alt text for images, link text for links)
  const altOrLinkText = text.substring(openBracketIndex + 1, lastParenIndex);

  if (isImage) {
    // For images with incomplete URLs, replace with placeholder marker
    return `${beforeLink}![${altOrLinkText}](${INCOMPLETE_IMAGE_PLACEHOLDER})`;
  }

  // For links with incomplete URLs, handle based on linkMode
  if (linkMode === "text-only") {
    return `${beforeLink}${altOrLinkText}`;
  }
  return `${beforeLink}[${altOrLinkText}](streamdown:incomplete-link)`;
};

// Bracket structure of one text, computed in a single pass so the per-bracket
// probes below are O(1). Re-running findMatchingClosingBracket for every "["
// would make nested brackets quadratic.
interface BracketIndex {
  // Matching "]" for each "[" outside complete code spans, or -1. Same rules
  // as findMatchingClosingBracket: brackets inside complete spans don't count.
  // Callers only look up brackets outside code, which are always indexed.
  closeOf: Int32Array;
  // Last "]" and ")" anywhere in the raw text, or -1
  lastClose: number;
  lastParen: number;
}

const indexBrackets = (text: string, scan: TextScan): BracketIndex => {
  const closeOf = new Int32Array(text.length).fill(-1);
  const open: number[] = [];
  for (let i = 0; i < text.length; i += 1) {
    if (isCompleteSpanAt(scan, i)) {
      continue;
    }
    if (text[i] === "[") {
      open.push(i);
    } else if (text[i] === "]" && open.length > 0) {
      closeOf[open.pop() as number] = i;
    }
  }
  return {
    closeOf,
    lastClose: text.lastIndexOf("]"),
    lastParen: text.lastIndexOf(")"),
  };
};

// Helper to find the first incomplete [ (for text-only mode)
// Always returns a valid index since callers guarantee text[maxPos] is an incomplete [
const findFirstIncompleteBracket = (
  text: string,
  maxPos: number,
  blockStart: number,
  brackets: BracketIndex
): number => {
  for (let j = blockStart; j < maxPos; j++) {
    if (text[j] === "[" && !isInsideCodeBlock(text, j)) {
      // Skip if it's an image
      if (j > 0 && text[j - 1] === "!") {
        continue;
      }
      // Check if this [ has a matching ]
      const closingIdx = brackets.closeOf[j];
      if (closingIdx === -1) {
        // This is an incomplete [
        return j;
      }
      // This [ is complete, check if it's a full link [text](url)
      // Only search for ")" when one exists; each search is bounded and
      // ends at the link's own ")", which j then skips past
      if (
        closingIdx + 1 < text.length &&
        text[closingIdx + 1] === "(" &&
        brackets.lastParen >= closingIdx + 2
      ) {
        const linkClose = findLinkClose(text, closingIdx + 1);
        if (linkClose !== -1) {
          // Skip past this complete link
          j = linkClose;
        }
      }
    }
  }
  // Fallback: the bracket at maxPos is always incomplete by contract
  return maxPos;
};

// Helper function to handle incomplete link text (unclosed brackets)
const handleIncompleteText = (
  text: string,
  i: number,
  linkMode: LinkMode,
  blockStart: number,
  brackets: BracketIndex
): string | null => {
  // Check if there's a ! before it
  const isImage = i > 0 && text[i - 1] === "!";
  const openIndex = isImage ? i - 1 : i;

  // Check if we have a closing bracket after this
  if (brackets.lastClose <= i) {
    // This is an incomplete link/image
    const beforeLink = text.substring(0, openIndex);

    if (isImage) {
      // For images with incomplete alt text, replace with placeholder marker
      const altText = text.substring(i + 1);
      return `${beforeLink}![${altText}](${INCOMPLETE_IMAGE_PLACEHOLDER})`;
    }

    // For links, handle based on linkMode
    if (linkMode === "text-only") {
      // Find the first incomplete [ and strip just that bracket
      const firstIncomplete = findFirstIncompleteBracket(
        text,
        i,
        blockStart,
        brackets
      );
      return (
        text.substring(0, firstIncomplete) + text.substring(firstIncomplete + 1)
      );
    }
    // Preserve the text and close the link with a placeholder URL
    return `${text}](streamdown:incomplete-link)`;
  }

  // If we found a closing bracket, we need to check if it's the matching one
  // (accounting for nested brackets)
  const closingIndex = brackets.closeOf[i];
  if (closingIndex === -1) {
    // No matching closing bracket
    const beforeLink = text.substring(0, openIndex);

    if (isImage) {
      // For images with no matching closing bracket, replace with placeholder marker
      const altText = text.substring(i + 1);
      return `${beforeLink}![${altText}](${INCOMPLETE_IMAGE_PLACEHOLDER})`;
    }

    if (linkMode === "text-only") {
      // Find the first incomplete [ and strip just that bracket
      const firstIncomplete = findFirstIncompleteBracket(
        text,
        i,
        blockStart,
        brackets
      );
      return (
        text.substring(0, firstIncomplete) + text.substring(firstIncomplete + 1)
      );
    }
    return `${text}](streamdown:incomplete-link)`;
  }

  return null;
};

const opensCompleteLink = (
  text: string,
  open: number,
  brackets: BracketIndex
): boolean => {
  const close = brackets.closeOf[open];
  return (
    close !== -1 &&
    text[close + 1] === "(" &&
    brackets.lastParen >= close + 2 &&
    findLinkClose(text, close + 1) !== -1
  );
};

// One healing step over the trailing incomplete link or image, if any
const healTrailingLinkOrImage = (text: string, linkMode: LinkMode): string => {
  // Look for patterns like [text]( or ![text]( at the end of text
  // We need to handle nested brackets in the link text

  // Link text cannot cross blocks, so brackets before the last inline block
  // are literal. Healing them would append a closer to the wrong block, or
  // drop every block after them.
  const scan = getScan(text);
  const blockStart = findInlineBlockStart(scan);

  // Start from the end and look for ]( pattern
  const lastParenIndex = text.lastIndexOf("](");
  if (
    lastParenIndex >= blockStart &&
    !isInsideCodeBlock(text, lastParenIndex)
  ) {
    const result = handleIncompleteUrl(
      text,
      lastParenIndex,
      linkMode,
      blockStart
    );
    if (result !== null) {
      return result;
    }
  }

  // Then check for incomplete link text: [partial-text without closing ]
  // Search backwards for an opening bracket that doesn't have a matching closing bracket
  const brackets = indexBrackets(text, scan);
  let enclosesLink = false;
  for (
    let i = text.lastIndexOf("[");
    i >= blockStart;
    i = i === 0 ? -1 : text.lastIndexOf("[", i - 1)
  ) {
    // An unclosed backtick renders as text, so a link after one still counts
    const isLink = !(
      (i > 0 && text[i - 1] === "!") ||
      isFenceAt(scan, i) ||
      isCompleteSpanAt(scan, i)
    );
    // Links can't contain links, so a link bracket before one is literal text.
    // Skip its completed-link probe too: unmatched prefixes would otherwise
    // each rescan the remaining suffix, making this loop quadratic.
    if (isLink && enclosesLink) {
      continue;
    }
    const closesHere = isLink && opensCompleteLink(text, i, brackets);
    enclosesLink ||= closesHere;
    if (!(closesHere || isInsideCodeBlock(text, i))) {
      const result = handleIncompleteText(
        text,
        i,
        linkMode,
        blockStart,
        brackets
      );
      if (result !== null) {
        return result;
      }
    }
  }

  return text;
};

// A pass costs a full rescan of the shortened text, so an adversarial tail
// of thousands of nested incomplete constructs would turn healing quadratic
// without a bound. Realistic nesting depth is single digits.
const MAX_HEAL_PASSES = 32;

const healLinksAndImages = (text: string, linkMode: LinkMode): string => {
  let current = text;

  // Removing a trailing incomplete image can expose another incomplete
  // construct that ended immediately before it (an input ending in "![!["
  // heals to "![", which is itself incomplete). Completing one can leave the
  // link around it open too: "[![alt" heals to "[![alt](…)", whose "[" still
  // needs closing. Iterate until healed text re-heals to itself, so healing
  // is idempotent. Each step heals the innermost open construct, and the
  // pass bound keeps the loop finite.
  for (let pass = 0; pass < MAX_HEAL_PASSES; pass += 1) {
    const next = healTrailingLinkOrImage(current, linkMode);
    if (next === current) {
      return next;
    }
    current = next;
  }
  return current;
};

const endsWithPlaceholder = (text: string): boolean =>
  text.endsWith("](streamdown:incomplete-link)") ||
  text.endsWith(`](${INCOMPLETE_IMAGE_PLACEHOLDER})`);

// Preserves incomplete links and images with a special marker.
export const handleIncompleteLinksAndImages = (
  text: string,
  linkMode: LinkMode = "protocol",
  closeInlineCode = false
): string => {
  const healed = healLinksAndImages(text, linkMode);
  if (healed !== text || !closeInlineCode || endsWithPlaceholder(text)) {
    return healed;
  }
  const span = getScan(text).openSpan;
  if (!span || text.lastIndexOf("[", span.start) === -1) {
    return text;
  }

  // Code spans bind tighter than links, so closing an open span can swallow
  // brackets and leave a link opener unclosed. Heal against the span the
  // inline code handler will close, and keep that only when a link needed it.
  // Trailing whitespace stays outside the closers, as the inline code
  // handler leaves it
  const body = text.trimEnd();
  const closed = handleIncompleteInlineCode(body);
  if (closed === body) {
    return text;
  }
  const relinked = healLinksAndImages(closed, linkMode);
  return relinked === closed ? text : relinked + text.slice(body.length);
};
