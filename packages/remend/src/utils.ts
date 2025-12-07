import { letterNumberUnderscorePattern } from "./patterns";

// OPTIMIZATION: Precompute which characters are word characters
// Using ASCII fast path before falling back to Unicode regex
export const isWordChar = (char: string): boolean => {
  if (!char) {
    return false;
  }
  const code = char.charCodeAt(0);
  // ASCII optimization: a-z, A-Z, 0-9, _
  if (
    (code >= 48 && code <= 57) || // 0-9
    (code >= 65 && code <= 90) || // A-Z
    (code >= 97 && code <= 122) || // a-z
    code === 95 // _
  ) {
    return true;
  }
  // Fallback to regex for Unicode characters (less common)
  return letterNumberUnderscorePattern.test(char);
};

// Helper function to check if we have a complete code block
export const hasCompleteCodeBlock = (text: string): boolean => {
  const tripleBackticks = (text.match(/```/g) || []).length;
  return (
    tripleBackticks > 0 && tripleBackticks % 2 === 0 && text.includes("\n")
  );
};

// Helper function to find the matching opening bracket for a closing bracket
// Handles nested brackets correctly by searching backwards
export const findMatchingOpeningBracket = (
  text: string,
  closeIndex: number
): number => {
  let depth = 1;
  for (let i = closeIndex - 1; i >= 0; i -= 1) {
    if (text[i] === "]") {
      depth += 1;
    } else if (text[i] === "[") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1; // No matching bracket found
};

// Helper function to find the matching closing bracket for an opening bracket
// Handles nested brackets correctly
export const findMatchingClosingBracket = (
  text: string,
  openIndex: number
): number => {
  let depth = 1;
  for (let i = openIndex + 1; i < text.length; i += 1) {
    if (text[i] === "[") {
      depth += 1;
    } else if (text[i] === "]") {
      depth -= 1;
      if (depth === 0) {
        return i;
      }
    }
  }
  return -1; // No matching bracket found
};

// Check if a position is within a math block (between $ or $$)
export const isWithinMathBlock = (text: string, position: number): boolean => {
  // Count dollar signs before this position
  let inInlineMath = false;
  let inBlockMath = false;

  for (let i = 0; i < text.length && i < position; i += 1) {
    // Skip escaped dollar signs
    if (text[i] === "\\" && text[i + 1] === "$") {
      i += 1; // Skip the next character
      continue;
    }

    if (text[i] === "$") {
      // Check for block math ($$)
      if (text[i + 1] === "$") {
        inBlockMath = !inBlockMath;
        i += 1; // Skip the second $
        inInlineMath = false; // Block math takes precedence
      } else if (!inBlockMath) {
        // Only toggle inline math if not in block math
        inInlineMath = !inInlineMath;
      }
    }
  }

  return inInlineMath || inBlockMath;
};

// Check if a position is within a link or image URL
// Links and images have the format [text](url) or ![alt](url)
export const isWithinLinkOrImageUrl = (
  text: string,
  position: number
): boolean => {
  // Search backwards from position to find if we're inside a (url) part
  // Look for the most recent ]( before this position
  let lastCloseParen = -1;
  let lastOpenParen = -1;

  for (let i = position - 1; i >= 0; i -= 1) {
    if (text[i] === ")") {
      lastCloseParen = i;
      break;
    }
    if (text[i] === "(") {
      lastOpenParen = i;
      // Check if there's a ] immediately before the (
      if (i > 0 && text[i - 1] === "]") {
        // We're potentially inside a link/image URL
        // Now search forward to see if we're before the closing )
        for (let j = position; j < text.length; j += 1) {
          if (text[j] === ")") {
            // Yes, we're inside the URL
            return true;
          }
          if (text[j] === "\n") {
            // URLs don't span newlines in markdown
            break;
          }
        }
      }
      break;
    }
    if (text[i] === "\n") {
      // Don't search beyond newlines
      break;
    }
  }

  return false;
};

// Check if a marker sequence appears to be a horizontal rule
// Horizontal rules must be on their own line with optional leading/trailing whitespace
// Valid patterns: ---, ***, ___, or longer sequences with optional spaces between markers
export const isHorizontalRule = (
  text: string,
  markerIndex: number,
  marker: string
): boolean => {
  // Find the start of the line containing this marker
  let lineStart = 0;
  for (let i = markerIndex - 1; i >= 0; i -= 1) {
    if (text[i] === "\n") {
      lineStart = i + 1;
      break;
    }
  }

  // Find the end of the line containing this marker
  let lineEnd = text.length;
  for (let i = markerIndex; i < text.length; i += 1) {
    if (text[i] === "\n") {
      lineEnd = i;
      break;
    }
  }

  const line = text.substring(lineStart, lineEnd);

  // Check if the line matches horizontal rule pattern
  // Must be: optional spaces + at least 3 markers + optional spaces
  // Can have spaces between markers (e.g., "* * *")
  let markerCount = 0;
  let hasNonWhitespaceNonMarker = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === marker) {
      markerCount += 1;
    } else if (char !== " " && char !== "\t") {
      // Found a character that's not a space, tab, or the marker
      hasNonWhitespaceNonMarker = true;
      break;
    }
  }

  // A horizontal rule needs:
  // 1. At least 3 markers
  // 2. No other non-whitespace characters on the line
  return markerCount >= 3 && !hasNonWhitespaceNonMarker;
};
