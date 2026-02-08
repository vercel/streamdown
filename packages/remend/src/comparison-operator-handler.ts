// Handles > characters that are comparison operators inside list items
// AI models frequently generate list items like "- > 25: expensive" where
// the > is a "greater than" operator, not a blockquote marker.

import { isWithinCodeBlock } from "./utils";

// Match list items where > appears as a comparison operator followed by a digit
// Pattern: list marker (-, *, +, or 1.) followed by > then optional = and a digit
// The \d check ensures we only escape > when it's clearly a comparison (not a real blockquote)
const LIST_COMPARISON_PATTERN = /^(\s*(?:[-*+]|\d+[.)]) +)>(=?\s*[$]?\d)/gm;

export const handleComparisonOperators = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Quick check: if there's no > in the text, skip processing
  if (!text.includes(">")) {
    return text;
  }

  return text.replace(
    LIST_COMPARISON_PATTERN,
    (match, prefix, suffix, offset) => {
      // Don't escape inside code blocks
      if (isWithinCodeBlock(text, offset)) {
        return match;
      }

      return `${prefix}\\>${suffix}`;
    }
  );
};
