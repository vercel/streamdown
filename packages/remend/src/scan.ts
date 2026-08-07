// Single-pass classification of a text into code and prose regions.
//
// Handlers previously re-derived "am I inside code?" per candidate character
// with O(n) rescans, making remend quadratic on delimiter-heavy input. This
// module scans once per input string (memoized) so every position query is
// O(1), and centralizes fence semantics that were previously approximated
// with a context-free ``` toggle:
//
// - A fence only opens at the start of a line, indented at most 3 spaces.
// - Both ``` and ~~~ fences are recognized, with runs of 3 or more.
// - The info string of a backtick fence cannot contain a backtick
//   (a line like ```code``` is inline code, not a fence).
// - A fence closes on a run of the same character at least as long as the
//   opener, alone on its line.
// - An inline code span opened by a run of N backticks closes only on a run
//   of exactly N backticks; other runs are literal inside the span.

export const REGION = {
  PROSE: 0,
  /** The ``` or ~~~ run that opens or closes a fence */
  FENCE_MARKER: 1,
  /** The info string on a fence opener line. Neither prose nor code body. */
  FENCE_INFO: 2,
  /** Content of a fenced code block */
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
  /** Lazily computed masks backing the inMathAt/inLinkUrlAt/inHtmlTagAt helpers */
  mathMask: Uint8Array | null;
  /** Fence still open at end of text, if any */
  openFence: OpenFence | null;
  /** Inline code span still open at end of text, if any */
  openSpan: OpenSpan | null;
  regions: Uint8Array;
  text: string;
}

const FENCE_OPENER_PATTERN = /^( {0,3})(`{3,}|~{3,})(.*)$/;

// Marks the fence regions of one opener line and returns the open fence state
const paintFenceOpener = (
  regions: Uint8Array,
  lineStart: number,
  lineEnd: number,
  indentLength: number,
  markerLength: number
): void => {
  const markerStart = lineStart + indentLength;
  regions.fill(REGION.FENCE_MARKER, markerStart, markerStart + markerLength);
  // Info string plus the line terminator belong to the fence, not to prose
  regions.fill(
    REGION.FENCE_INFO,
    markerStart + markerLength,
    Math.min(lineEnd + 1, regions.length)
  );
};

// Whether a line inside an open fence closes it: at most 3 spaces of indent,
// then a run of the fence character at least as long as the opener, then
// only whitespace
const isFenceCloser = (
  text: string,
  lineStart: number,
  lineEnd: number,
  fence: OpenFence
): boolean => {
  let i = lineStart;
  let indent = 0;
  while (i < lineEnd && text[i] === " " && indent < 4) {
    i += 1;
    indent += 1;
  }
  if (indent > 3) {
    return false;
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
    if (text[i] !== " " && text[i] !== "\t") {
      return false;
    }
    i += 1;
  }
  return true;
};

// First pass: paint fenced code blocks line by line
const paintFences = (text: string, regions: Uint8Array): OpenFence | null => {
  const n = text.length;
  let openFence: OpenFence | null = null;
  let lineStart = 0;

  while (lineStart < n) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = n;
    }

    if (openFence) {
      if (isFenceCloser(text, lineStart, lineEnd, openFence)) {
        regions.fill(REGION.FENCE_MARKER, lineStart, lineEnd);
        openFence = null;
      } else {
        regions.fill(REGION.FENCE_BODY, lineStart, Math.min(lineEnd + 1, n));
      }
    } else {
      const line = text.slice(lineStart, lineEnd);
      const opener = line.match(FENCE_OPENER_PATTERN);
      if (opener) {
        const markerChar = opener[2][0] as "`" | "~";
        // A backtick fence's info string cannot contain a backtick; such a
        // line is inline code instead
        if (markerChar === "~" || !opener[3].includes("`")) {
          paintFenceOpener(
            regions,
            lineStart,
            lineEnd,
            opener[1].length,
            opener[2].length
          );
          openFence = { char: markerChar, length: opener[2].length };
        }
      }
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

// Second pass: paint inline code spans in the regions fences left as prose
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

/** Whether the position is inside any code construct (fence or span) */
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

/** Whether the position is inside a complete inline code span */
export const isCompleteSpanAt = (scan: TextScan, position: number): boolean =>
  scan.regions[position] === REGION.CODE_SPAN;

// Math mask: for each position, whether it is inside $...$ or $$...$$,
// mirroring the sequential toggle semantics the per-position helper used
const buildMathMask = (text: string): Uint8Array => {
  const n = text.length;
  const mask = new Uint8Array(n);
  let inInlineMath = false;
  let inBlockMath = false;

  let i = 0;
  while (i < n) {
    mask[i] = inInlineMath || inBlockMath ? 1 : 0;
    if (text[i] === "\\" && text[i + 1] === "$") {
      if (i + 1 < n) {
        mask[i + 1] = mask[i];
      }
      i += 2;
      continue;
    }
    if (text[i] !== "$") {
      i += 1;
      continue;
    }
    if (text[i + 1] === "$") {
      inBlockMath = !inBlockMath;
      inInlineMath = false;
      if (i + 1 < n) {
        mask[i + 1] = 1;
      }
      i += 2;
      continue;
    }
    if (!inBlockMath) {
      inInlineMath = !inInlineMath;
    }
    i += 1;
  }

  return mask;
};

export const inMathAt = (scan: TextScan, position: number): boolean => {
  if (position < 0 || position >= scan.text.length) {
    return false;
  }
  if (scan.mathMask === null) {
    scan.mathMask = buildMathMask(scan.text);
  }
  return scan.mathMask[position] === 1;
};

// Marks the URL positions of one line: those between a "](" opener and the
// next ")" on the line. Two sub-passes: backward to know whether a ")" still
// follows a position, forward to know whether the nearest paren boundary
// before a position is a "](" opener.
const paintLinkUrlLine = (
  text: string,
  lineStart: number,
  lineEnd: number,
  mask: Uint8Array
): void => {
  // closerFollows[i - lineStart]: a ")" exists at or after i on this line
  const closerFollows = new Uint8Array(lineEnd - lineStart);
  let seenCloser = 0;
  for (let i = lineEnd - 1; i >= lineStart; i -= 1) {
    if (text[i] === ")") {
      seenCloser = 1;
    }
    closerFollows[i - lineStart] = seenCloser;
  }

  let inUrl = false;
  for (let i = lineStart; i < lineEnd; i += 1) {
    if (inUrl && closerFollows[i - lineStart] === 1) {
      mask[i] = 1;
    }
    if (text[i] === ")") {
      inUrl = false;
    } else if (text[i] === "(") {
      inUrl = i > 0 && text[i - 1] === "]";
    }
  }
};

// Link/image URL mask: positions inside the (url) part of [text](url)
const buildLinkUrlMask = (text: string): Uint8Array => {
  const n = text.length;
  const mask = new Uint8Array(n);
  let lineStart = 0;

  while (lineStart < n) {
    let lineEnd = text.indexOf("\n", lineStart);
    if (lineEnd === -1) {
      lineEnd = n;
    }
    paintLinkUrlLine(text, lineStart, lineEnd, mask);
    lineStart = lineEnd + 1;
  }

  return mask;
};

export const inLinkUrlAt = (scan: TextScan, position: number): boolean => {
  if (position < 0 || position >= scan.text.length) {
    return false;
  }
  if (scan.linkUrlMask === null) {
    scan.linkUrlMask = buildLinkUrlMask(scan.text);
  }
  return scan.linkUrlMask[position] === 1;
};

// HTML tag mask: positions after a "<" that begins a plausible tag (letter
// or /), through the closing ">" inclusive, within a single line
const buildHtmlTagMask = (text: string): Uint8Array => {
  const n = text.length;
  const mask = new Uint8Array(n);
  let inTag = false;

  for (let i = 0; i < n; i += 1) {
    if (text[i] === "\n") {
      inTag = false;
      continue;
    }
    mask[i] = inTag ? 1 : 0;
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
    scan.htmlTagMask = buildHtmlTagMask(scan.text);
  }
  return scan.htmlTagMask[position] === 1;
};
