// Escapes single ~ characters that appear between word characters
// to prevent remarkGfm (with singleTilde: true) from misinterpreting
// them as strikethrough markers.
// e.g. "20~25°C" → "20\~25°C" (not strikethrough)
// Does NOT escape ~~ (double tilde, valid strikethrough syntax).

import { isInsideCodeBlock } from "./code-block-utils";

// Match a single ~ that is:
// - preceded by a word character (letter, number, or underscore)
// - NOT preceded by another ~ (to avoid matching ~~)
// - NOT followed by another ~ (to avoid matching ~~)
// - followed by a word character
// Uses Unicode-aware \p{L} and \p{N} for CJK and other scripts
const SINGLE_TILDE_PATTERN = /(?<=[\p{L}\p{N}_])~(?!~)(?=[\p{L}\p{N}_])/gu;

export const handleSingleTildeEscape = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Quick check: if there's no ~ in the text, skip processing
  if (!text.includes("~")) {
    return text;
  }

  return text.replace(SINGLE_TILDE_PATTERN, (match, offset) => {
    // Don't escape inside code blocks
    if (isInsideCodeBlock(text, offset)) {
      return match;
    }

    return "\\~";
  });
};
