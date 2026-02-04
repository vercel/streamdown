/**
 * Checks if a markdown string contains an incomplete code fence.
 *
 * A code fence is incomplete if there's an odd number of ``` markers,
 * meaning there's an opening fence without a closing fence.
 *
 * @param markdown - The markdown string to check
 * @returns true if there's an incomplete code fence
 *
 * @example
 * ```ts
 * hasIncompleteCodeFence("```javascript\nconst x = 1;") // true - no closing fence
 * hasIncompleteCodeFence("```javascript\nconst x = 1;\n```") // false - complete
 * hasIncompleteCodeFence("Some text") // false - no code fence
 * ```
 */
export const hasIncompleteCodeFence = (markdown: string): boolean => {
  // Count triple backtick occurrences
  // We need to be careful not to count escaped backticks or inline code
  let count = 0;
  let i = 0;

  while (i < markdown.length - 2) {
    if (
      markdown[i] === "`" &&
      markdown[i + 1] === "`" &&
      markdown[i + 2] === "`"
    ) {
      count += 1;
      i += 3; // Skip past the triple backticks
    } else {
      i += 1;
    }
  }

  // Odd count means there's an unclosed code fence
  return count % 2 === 1;
};
