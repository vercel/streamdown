// Single-pass classification of a text into code and prose regions.
//
// Healing runs on every streaming token, and every handler needs to know
// whether a candidate delimiter sits in prose or in code. A single scan
// paints a region code for every position, memoized per input string, so
// each query is O(1) and healing stays linear in the input no matter how
// many delimiters it holds. The lazy masks below answer the same question
// for math, link URLs, and HTML tags.
//
// Fence and span semantics follow CommonMark:
//
// - A fence opens only at the start of a line, with any indentation, after any
//   block quote and list markers. CommonMark caps a top-level fence at 3
//   spaces, but fences nested in list items carry deeper absolute indents and
//   a line-based scan has no list context. Reading an indented line as code is
//   the safe direction: healing then leaves it alone instead of corrupting it.
// - A fence inside a block quote reads its lines after the quote markers, and
//   ends with the quote: a line with fewer markers closes it, because fenced
//   code has no lazy continuation. Likewise a fence opened on a list marker's
//   line ends with the item, at a non-blank line indented short of its
//   content. A fence opened on a later line of an item keeps the lenient
//   reading above.
// - Both ``` and ~~~ fences are recognized, with runs of 3 or more.
// - The info string of a backtick fence cannot contain a backtick
//   (a line like ```code``` is inline code, not a fence).
// - A fence closes on a run of the same character at least as long as the
//   opener, alone on its line. Lines may end in \n or \r\n.
// - An inline code span opened by a run of N backticks closes only on a run
//   of exactly N backticks. Other runs are literal inside the span.
// - A span cannot cross a blank line: inline parsing is paragraph-scoped, so
//   an unmatched run in a finished paragraph stays literal prose.

export const REGION = {
  PROSE: 0,
  /** The ``` or ~~~ run that opens or closes a fence */
  FENCE_MARKER: 1,
  /** The info string on a fence opener line. Neither prose nor code body. */
  FENCE_INFO: 2,
  FENCE_BODY: 3,
  /** A complete inline code span, including its backtick markers */
  CODE_SPAN: 4,
  /** An inline code span whose closing run has not arrived yet */
  CODE_SPAN_OPEN: 5,
} as const;

export type Region = (typeof REGION)[keyof typeof REGION];

export interface OpenFence {
  char: "`" | "~";
  /** Length of the opening run; a closer must be at least this long */
  length: number;
  /**
   * Content column of the list item the opener line starts, measured after
   * the quote markers. Zero when the opener line starts no list item.
   */
  listIndent: number;
  /** Block quote markers before the opener; each body line must repeat them */
  quoteDepth: number;
}

export interface OpenSpan {
  /** Length of the opening run; the closer must match it exactly */
  runLength: number;
  /** Index of the first backtick of the opening run */
  start: number;
}

export interface TextScan {
  htmlTagMask: Uint8Array | null;
  linkUrlMask: Uint8Array | null;
  /** Lazily computed; stays null until first needed */
  mathMask: Uint8Array | null;
  openFence: OpenFence | null;
  openSpan: OpenSpan | null;
  regions: Uint8Array;
  text: string;
}

const FENCE_RUN_PATTERN = /^(`{3,}|~{3,})(.*)$/;

const isDigit = (char: string | undefined): boolean =>
  char !== undefined && char >= "0" && char <= "9";

// Index just past a list marker and its space at `start`, or -1
const skipListMarker = (text: string, start: number): number => {
  let i = start;
  if (text[i] === "-" || text[i] === "*" || text[i] === "+") {
    i += 1;
  } else {
    while (isDigit(text[i]) && i - start < 9) {
      i += 1;
    }
    if (i === start || (text[i] !== "." && text[i] !== ")")) {
      return -1;
    }
    i += 1;
  }
  return text[i] === " " ? i + 1 : -1;
};

interface ContainerPrefix {
  /** Index of the first character after the markers and indentation */
  contentStart: number;
  listIndent: number;
  quoteDepth: number;
}

// Walks the block quote and list markers that open a line. A single forward
// pass: a regex with nested repetition over these markers backtracks
// exponentially on a line of repeated list markers.
const skipContainerPrefix = (
  text: string,
  lineStart: number,
  lineEnd: number
): ContainerPrefix => {
  let quoteDepth = 0;
  let afterQuotes = lineStart;
  let startsItem = false;
  let i = lineStart;
  for (;;) {
    while (i < lineEnd && text[i] === " ") {
      i += 1;
    }
    if (text[i] === ">") {
      quoteDepth += 1;
      i += text[i + 1] === " " ? 2 : 1;
      afterQuotes = i;
      startsItem = false;
      continue;
    }
    const afterMarker = i < lineEnd ? skipListMarker(text, i) : -1;
    if (afterMarker === -1) {
      return {
        contentStart: i,
        listIndent: startsItem ? i - afterQuotes : 0,
        quoteDepth,
      };
    }
    i = afterMarker;
    startsItem = true;
  }
};

// Index just past up to `depth` block quote markers at the start of a line,
// or -1 if the line carries fewer
const skipQuoteMarkers = (
  text: string,
  lineStart: number,
  lineEnd: number,
  depth: number
): number => {
  let i = lineStart;
  for (let found = 0; found < depth; found += 1) {
    while (i < lineEnd && text[i] === " ") {
      i += 1;
    }
    if (text[i] !== ">") {
      return -1;
    }
    i += 1;
    if (text[i] === " ") {
      i += 1;
    }
  }
  return i;
};

const paintFenceOpener = (
  regions: Uint8Array,
  lineStart: number,
  lineEnd: number,
  indentLength: number,
  markerLength: number
): void => {
  const markerStart = lineStart + indentLength;
  regions.fill(REGION.FENCE_MARKER, markerStart, markerStart + markerLength);
  // Info string plus the line terminator belong to the fence.
  regions.fill(
    REGION.FENCE_INFO,
    markerStart + markerLength,
    Math.min(lineEnd + 1, regions.length)
  );
};

// Whether a line inside an open fence closes it: optional indent, then a run
// of the fence character at least as long as the opener, then only whitespace
const isFenceCloser = (
  text: string,
  contentStart: number,
  lineEnd: number,
  fence: OpenFence
): boolean => {
  let i = contentStart;
  while (i < lineEnd && text[i] === " ") {
    i += 1;
  }
  let runLength = 0;
  while (i < lineEnd && text[i] === fence.char) {
    i += 1;
    runLength += 1;
  }
  if (runLength < fence.length) {
    return false;
  }
  while (i < lineEnd) {
    if (text[i] !== " " && text[i] !== "\t" && text[i] !== "\r") {
      return false;
    }
    i += 1;
  }
  return true;
};

const openFenceAt = (
  text: string,
  regions: Uint8Array,
  lineStart: number,
  lineEnd: number
): OpenFence | null => {
  const contentEnd =
    lineEnd > lineStart && text[lineEnd - 1] === "\r" ? lineEnd - 1 : lineEnd;
  const prefix = skipContainerPrefix(text, lineStart, contentEnd);
  const opener = text
    .slice(prefix.contentStart, contentEnd)
    .match(FENCE_RUN_PATTERN);
  if (!opener) {
    return null;
  }
  const [, run, info] = opener;
  const char = run[0] as "`" | "~";
  // A backtick fence's info string cannot contain a backtick; such a line is
  // inline code instead
  if (char === "`" && info.includes("`")) {
    return null;
  }
  paintFenceOpener(
    regions,
    lineStart,
    lineEnd,
    prefix.contentStart - lineStart,
    run.length
  );
  return {
    char,
    length: run.length,
    listIndent: prefix.listIndent,
    quoteDepth: prefix.quoteDepth,
  };
};

// Index where a body line's content starts inside its fence's containers, or
// -1 if the line leaves them and so ends the fence
const fenceContentStart = (
  text: string,
  lineStart: number,
  lineEnd: number,
  fence: OpenFence
): number => {
  const contentStart = skipQuoteMarkers(
    text,
    lineStart,
    lineEnd,
    fence.quoteDepth
  );
  if (contentStart === -1 || fence.listIndent === 0) {
    return contentStart;
  }
  let i = contentStart;
  while (i < lineEnd && text[i] === " ") {
    i += 1;
  }
  const blank = i === lineEnd || (text[i] === "\r" && i + 1 === lineEnd);
  return blank || i - contentStart >= fence.listIndent ? contentStart : -1;
};

const paintFences = (text: string, regions: Uint8Array): OpenFence | null => {
  const n = text.length;
  let openFence: OpenFence | null = null;
  let lineStart = 0;

  while (lineStart < n) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = n;
    }

    const contentStart = openFence
      ? fenceContentStart(text, lineStart, lineEnd, openFence)
      : -1;
    if (openFence && contentStart === -1) {
      // The block quote or list item ended, taking the fence with it
      openFence = null;
    }

    if (!openFence) {
      openFence = openFenceAt(text, regions, lineStart, lineEnd);
    } else if (isFenceCloser(text, contentStart, lineEnd, openFence)) {
      regions.fill(REGION.FENCE_MARKER, lineStart, lineEnd);
      openFence = null;
    } else {
      regions.fill(REGION.FENCE_BODY, lineStart, Math.min(lineEnd + 1, n));
    }

    lineStart = lineEnd + 1;
  }

  return openFence;
};

const measureBacktickRun = (text: string, start: number): number => {
  let end = start + 1;
  while (end < text.length && text[end] === "`") {
    end += 1;
  }
  return end;
};

// A blank line ends the paragraph, and with it any chance of closing a span
const isParagraphBreakAt = (text: string, newlineIndex: number): boolean => {
  let j = newlineIndex + 1;
  while (
    j < text.length &&
    (text[j] === " " || text[j] === "\t" || text[j] === "\r")
  ) {
    j += 1;
  }
  return j < text.length && text[j] === "\n";
};

const paintSpans = (text: string, regions: Uint8Array): OpenSpan | null => {
  const n = text.length;
  let spanStart = -1;
  let spanRunLength = 0;
  let i = 0;

  while (i < n) {
    if (regions[i] !== REGION.PROSE) {
      // A span cannot cross into a fence, so leave it marked open up to here
      if (spanStart >= 0) {
        regions.fill(REGION.CODE_SPAN_OPEN, spanStart, i);
        spanStart = -1;
      }
      i += 1;
      continue;
    }
    if (text[i] === "\n" && spanStart >= 0 && isParagraphBreakAt(text, i)) {
      // The unmatched opener stays literal prose in its finished paragraph
      spanStart = -1;
      i += 1;
      continue;
    }
    if (text[i] === "\\" && text[i + 1] === "`" && spanStart < 0) {
      i += 2;
      continue;
    }
    if (text[i] !== "`") {
      i += 1;
      continue;
    }

    const runEnd = measureBacktickRun(text, i);
    const runLength = runEnd - i;
    if (spanStart < 0) {
      spanStart = i;
      spanRunLength = runLength;
    } else if (runLength === spanRunLength) {
      regions.fill(REGION.CODE_SPAN, spanStart, runEnd);
      spanStart = -1;
    }
    // A run of a different length is literal inside the open span
    i = runEnd;
  }

  if (spanStart >= 0) {
    regions.fill(REGION.CODE_SPAN_OPEN, spanStart, n);
    return { start: spanStart, runLength: spanRunLength };
  }
  return null;
};

const scanText = (text: string): TextScan => {
  const regions = new Uint8Array(text.length);
  const openFence = paintFences(text, regions);
  const openSpan = paintSpans(text, regions);
  return {
    text,
    regions,
    openFence,
    openSpan,
    mathMask: null,
    linkUrlMask: null,
    htmlTagMask: null,
  };
};

// Memoize the most recent scan. Handlers query many positions of the same
// string, and remend's handler chain passes each handler's output to the
// next, so a single-entry cache gives O(1) queries within a handler while
// staying O(n) per handler overall.
let cachedText: string | null = null;
let cachedScan: TextScan | null = null;

export const getScan = (text: string): TextScan => {
  if (cachedScan !== null && text === cachedText) {
    return cachedScan;
  }
  const scan = scanText(text);
  cachedText = text;
  cachedScan = scan;
  return scan;
};

/** A code construct here means a fence or inline span. */
export const isCodeAt = (scan: TextScan, position: number): boolean => {
  if (position >= scan.regions.length) {
    return scan.openFence !== null || scan.openSpan !== null;
  }
  if (position < 0) {
    return false;
  }
  return scan.regions[position] !== REGION.PROSE;
};

/** Whether the position is inside a fenced code block (marker, info, or body) */
export const isFenceAt = (scan: TextScan, position: number): boolean => {
  if (position >= scan.regions.length) {
    return scan.openFence !== null;
  }
  if (position < 0) {
    return false;
  }
  const region = scan.regions[position];
  return (
    region === REGION.FENCE_MARKER ||
    region === REGION.FENCE_INFO ||
    region === REGION.FENCE_BODY
  );
};

export const isCompleteSpanAt = (scan: TextScan, position: number): boolean =>
  scan.regions[position] === REGION.CODE_SPAN;

/** Counts non-overlapping double-character pairs (**, ~~, $$) in prose */
export const countDoublePairs = (text: string, char: string): number => {
  const scan = getScan(text);
  const pair = char + char;
  let count = 0;

  for (let i = text.indexOf(pair); i !== -1; i = text.indexOf(pair, i)) {
    if (scan.regions[i] === REGION.PROSE) {
      count += 1;
      i += 2;
    } else {
      i += 1;
    }
  }
  return count;
};

// The masks share the empty array when their trigger character is absent, so
// plain prose skips three allocations and passes per scan
const EMPTY_MASK = new Uint8Array(0);

type MathContext =
  | "none"
  | "inlineDollar"
  | "blockDollar"
  | "inlineLatex"
  | "blockLatex";

const isLatexMathContext = (context: MathContext): boolean =>
  context === "inlineLatex" || context === "blockLatex";

const getLatexMathContext = (
  context: MathContext,
  nextChar: string
): MathContext | null => {
  if (nextChar === "[" && context === "none") {
    return "blockLatex";
  }
  if (nextChar === "]" && context === "blockLatex") {
    return "none";
  }
  if (nextChar === "(" && context === "none") {
    return "inlineLatex";
  }
  if (nextChar === ")" && context === "inlineLatex") {
    return "none";
  }
  return null;
};

const getDollarMathContext = (
  context: MathContext,
  isBlockDelimiter: boolean
): MathContext => {
  if (isBlockDelimiter) {
    return context === "blockDollar" ? "none" : "blockDollar";
  }
  if (context === "blockDollar") {
    return context;
  }
  return context === "inlineDollar" ? "none" : "inlineDollar";
};

const hasMathDelimiters = (text: string): boolean =>
  text.includes("$") || text.includes("\\(") || text.includes("\\[");

// Recognizes a math delimiter or escaped dollar at position i
interface MathDelimiter {
  /** Context in effect after the delimiter */
  context: MathContext;
  length: 1 | 2;
}

const mathDelimiterAt = (
  text: string,
  i: number,
  context: MathContext
): MathDelimiter | null => {
  const next = text[i + 1];
  if (text[i] === "\\") {
    if (next === "$") {
      return { context, length: 2 };
    }
    const latexContext = getLatexMathContext(context, next);
    return latexContext === null ? null : { context: latexContext, length: 2 };
  }
  if (text[i] === "$" && !isLatexMathContext(context)) {
    const isBlockDelimiter = next === "$";
    return {
      context: getDollarMathContext(context, isBlockDelimiter),
      length: isBlockDelimiter ? 2 : 1,
    };
  }
  return null;
};

// Math mask: for each position, whether it is inside $...$, $$...$$,
// \(...\) or \[...\]. Delimiters inside code regions are literal and do
// not change math state. A two-character delimiter marks its second
// character with the context it establishes.
const buildMathMask = (scan: TextScan): Uint8Array => {
  const { text, regions } = scan;
  const n = text.length;
  const mask = new Uint8Array(n);
  let context: MathContext = "none";

  let i = 0;
  while (i < n) {
    mask[i] = context === "none" ? 0 : 1;
    const delimiter: MathDelimiter | null =
      regions[i] === REGION.PROSE ? mathDelimiterAt(text, i, context) : null;
    if (delimiter === null) {
      i += 1;
      continue;
    }
    context = delimiter.context;
    if (delimiter.length === 2) {
      mask[i + 1] = context === "none" ? 0 : 1;
    }
    i += delimiter.length;
  }

  return mask;
};

export const inMathAt = (scan: TextScan, position: number): boolean => {
  if (position < 0 || position >= scan.text.length) {
    return false;
  }
  if (scan.mathMask === null) {
    scan.mathMask = hasMathDelimiters(scan.text)
      ? buildMathMask(scan)
      : EMPTY_MASK;
  }
  return scan.mathMask[position] === 1;
};

// Marks the URL positions of one line: those between a "](" opener and the
// next ")" on the line. Two sub-passes: backward to know whether a ")" still
// follows a position, forward to know whether the nearest paren boundary
// before a position is a "](" opener.
const paintLinkUrlLine = (
  scan: TextScan,
  lineStart: number,
  lineEnd: number,
  mask: Uint8Array
): void => {
  const { text, regions } = scan;
  // closerFollows[i - lineStart]: a ")" exists at or after i on this line
  const closerFollows = new Uint8Array(lineEnd - lineStart);
  let seenCloser = 0;
  for (let i = lineEnd - 1; i >= lineStart; i -= 1) {
    if (text[i] === ")" && regions[i] === REGION.PROSE) {
      seenCloser = 1;
    }
    closerFollows[i - lineStart] = seenCloser;
  }

  let inUrl = false;
  for (let i = lineStart; i < lineEnd; i += 1) {
    if (inUrl && closerFollows[i - lineStart] === 1) {
      mask[i] = 1;
    }
    if (regions[i] !== REGION.PROSE) {
      continue;
    }
    if (text[i] === ")") {
      inUrl = false;
    } else if (text[i] === "(") {
      inUrl = i > 0 && text[i - 1] === "]";
    }
  }
};

// Link/image URL mask: positions inside the (url) part of [text](url).
// Delimiters inside code regions are literal and never open or close a URL.
const buildLinkUrlMask = (scan: TextScan): Uint8Array => {
  const { text } = scan;
  const n = text.length;
  const mask = new Uint8Array(n);
  let lineStart = 0;

  while (lineStart < n) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = n;
    }
    paintLinkUrlLine(scan, lineStart, lineEnd, mask);
    lineStart = lineEnd + 1;
  }

  return mask;
};

export const inLinkUrlAt = (scan: TextScan, position: number): boolean => {
  if (position < 0 || position >= scan.text.length) {
    return false;
  }
  if (scan.linkUrlMask === null) {
    scan.linkUrlMask = scan.text.includes("](")
      ? buildLinkUrlMask(scan)
      : EMPTY_MASK;
  }
  return scan.linkUrlMask[position] === 1;
};

// HTML tag mask: positions after a "<" that begins a plausible tag (letter
// or /), through the closing ">" inclusive, within a single line. Angle
// brackets inside code regions are literal and never open or close a tag.
const buildHtmlTagMask = (scan: TextScan): Uint8Array => {
  const { text, regions } = scan;
  const n = text.length;
  const mask = new Uint8Array(n);
  let inTag = false;

  for (let i = 0; i < n; i += 1) {
    if (text[i] === "\n") {
      inTag = false;
      continue;
    }
    mask[i] = inTag ? 1 : 0;
    if (regions[i] !== REGION.PROSE) {
      continue;
    }
    if (text[i] === ">") {
      inTag = false;
    } else if (text[i] === "<") {
      const next = text[i + 1];
      inTag =
        next !== undefined &&
        ((next >= "a" && next <= "z") ||
          (next >= "A" && next <= "Z") ||
          next === "/");
    }
  }

  return mask;
};

export const inHtmlTagAt = (scan: TextScan, position: number): boolean => {
  if (position < 0 || position >= scan.text.length) {
    return false;
  }
  if (scan.htmlTagMask === null) {
    scan.htmlTagMask = scan.text.includes("<")
      ? buildHtmlTagMask(scan)
      : EMPTY_MASK;
  }
  return scan.htmlTagMask[position] === 1;
};
