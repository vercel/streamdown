// Builds the isInsideCodeBlock answer for every position in one linear pass.
// lookup[p] === 1 means scanning chars [0, p) ends inside inline or fenced
// code. Scanning per call is O(position), which makes callers that probe many
// positions (e.g. the link handler walking every "[" of a long streamed code
// block) quadratic overall.
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Mirrors the original scan's control flow exactly so the lookup is provably equivalent"
const buildCodeBlockLookup = (text: string): Uint8Array => {
  const lookup = new Uint8Array(text.length + 1);
  let inInlineCode = false;
  let inMultilineCode = false;
  let i = 0;

  while (i < text.length) {
    // Skip escaped backticks
    if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "`") {
      const state = inInlineCode || inMultilineCode ? 1 : 0;
      lookup[i + 1] = state;
      lookup[i + 2] = state;
      i += 2;
      continue;
    }

    // Check for triple backticks (multiline code blocks)
    if (text.substring(i, i + 3) === "```") {
      inMultilineCode = !inMultilineCode;
      const state = inInlineCode || inMultilineCode ? 1 : 0;
      const next = Math.min(i + 3, text.length);
      for (let p = i + 1; p <= next; p += 1) {
        lookup[p] = state;
      }
      i = next;
      continue;
    }

    // Only check for inline code if not in multiline code
    if (!inMultilineCode && text[i] === "`") {
      inInlineCode = !inInlineCode;
    }
    lookup[i + 1] = inInlineCode || inMultilineCode ? 1 : 0;
    i += 1;
  }

  return lookup;
};

// Handlers repeatedly probe positions of the same text within one remend()
// call, so a single-entry cache converts each probe to O(1) after one O(n)
// build per distinct text.
let cache: { text: string; lookup: Uint8Array } | null = null;

// Check if a position is inside a code block (between ``` or `)
export const isInsideCodeBlock = (text: string, position: number): boolean => {
  let current = cache;
  if (current === null || current.text !== text) {
    current = { text, lookup: buildCodeBlockLookup(text) };
    cache = current;
  }
  // Positions past the end resolve to the state after scanning the full text,
  // matching the previous per-call scan.
  return current.lookup[Math.min(position, text.length)] === 1;
};

// Checks if a backtick at position i is part of a triple backtick sequence
export const isPartOfTripleBacktick = (text: string, i: number): boolean => {
  const isTripleStart = text.substring(i, i + 3) === "```";
  const isTripleMiddle = i > 0 && text.substring(i - 1, i + 2) === "```";
  const isTripleEnd = i > 1 && text.substring(i - 2, i + 1) === "```";

  return isTripleStart || isTripleMiddle || isTripleEnd;
};

// Counts single backticks that are not part of triple backticks or escaped
export const countSingleBackticks = (text: string): number => {
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    // Skip escaped backticks
    if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "`") {
      i += 1;
      continue;
    }
    if (text[i] === "`" && !isPartOfTripleBacktick(text, i)) {
      count += 1;
    }
  }
  return count;
};

// Check if a position is inside a COMPLETE inline code span (both opening and closing backtick present).
// Returns false for incomplete inline code spans (streaming) so emphasis markers can still be completed.
export const isWithinCompleteInlineCode = (
  text: string,
  position: number
): boolean => {
  let inInlineCode = false;
  let inMultilineCode = false;
  let inlineCodeStart = -1;

  for (let i = 0; i < text.length; i += 1) {
    // Skip escaped backticks
    if (text[i] === "\\" && i + 1 < text.length && text[i + 1] === "`") {
      i += 1;
      continue;
    }

    // Check for triple backticks (multiline code blocks)
    if (text.substring(i, i + 3) === "```") {
      inMultilineCode = !inMultilineCode;
      i += 2;
      continue;
    }

    // Only check for inline code if not in multiline code
    if (!inMultilineCode && text[i] === "`") {
      if (inInlineCode) {
        // Found closing backtick — check if position is inside this complete span
        if (inlineCodeStart < position && position < i) {
          return true;
        }
        inInlineCode = false;
        inlineCodeStart = -1;
      } else {
        inInlineCode = true;
        inlineCodeStart = i;
      }
    }
  }

  return false;
};
