/**
 * Counts occurrences of triple characters (``` or ~~~) in a string.
 */
const countTripleChars = (markdown: string, char: string): number => {
  let count = 0;
  let i = 0;

  while (i < markdown.length - 2) {
    if (
      markdown[i] === char &&
      markdown[i + 1] === char &&
      markdown[i + 2] === char
    ) {
      count += 1;
      i += 3; // Skip past the triple characters
    } else {
      i += 1;
    }
  }

  return count;
};

/**
 * Checks if a markdown string contains an incomplete code fence.
 *
 * A code fence is incomplete if there's an odd number of ``` or ~~~ markers,
 * meaning there's an opening fence without a closing fence.
 * Supports both backtick (```) and tilde (~~~) fences per CommonMark/GFM spec.
 *
 * @param markdown - The markdown string to check
 * @returns true if there's an incomplete code fence
 *
 * @example
 * ```ts
 * hasIncompleteCodeFence("```javascript\nconst x = 1;") // true - no closing fence
 * hasIncompleteCodeFence("```javascript\nconst x = 1;\n```") // false - complete
 * hasIncompleteCodeFence("~~~python\nprint('hi')") // true - no closing fence
 * hasIncompleteCodeFence("Some text") // false - no code fence
 * ```
 */
export const hasIncompleteCodeFence = (markdown: string): boolean => {
  const backtickCount = countTripleChars(markdown, "`");
  const tildeCount = countTripleChars(markdown, "~");

  // Odd count of either means there's an unclosed code fence
  return backtickCount % 2 === 1 || tildeCount % 2 === 1;
};
