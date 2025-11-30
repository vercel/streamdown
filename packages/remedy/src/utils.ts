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
