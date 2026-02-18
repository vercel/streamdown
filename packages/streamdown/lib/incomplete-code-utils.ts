/**
 * Regex matching a code fence at the start of a line per CommonMark spec.
 * Allows up to 3 spaces of indentation, then 3+ backticks or 3+ tildes.
 * Captures the fence character (` or ~) and the full fence run.
 */
const CODE_FENCE_PATTERN = /^[ \t]{0,3}(`{3,}|~{3,})/;

/**
 * Checks if a markdown string contains an incomplete (unclosed) code fence
 * by walking line-by-line per the CommonMark spec.
 *
 * Only counts fences that start at the beginning of a line (with up to 3
 * spaces of indentation). This avoids false positives from inline backticks
 * and correctly handles fences of any length (3+).
 *
 * A closing fence must use the same character as the opening fence and be
 * at least as long.
 *
 * @param markdown - The markdown string to check
 * @returns true if there's an unclosed code fence
 */
export const hasIncompleteCodeFence = (markdown: string): boolean => {
  const lines = markdown.split("\n");
  let openFenceChar: string | null = null;
  let openFenceLength = 0;

  for (const line of lines) {
    const match = CODE_FENCE_PATTERN.exec(line);

    if (openFenceChar === null) {
      // Not inside a fence — look for an opening fence
      if (match) {
        const fenceRun = match[1];
        openFenceChar = fenceRun[0];
        openFenceLength = fenceRun.length;
      }
    } else {
      // Inside a fence — look for a closing fence with the same char and >= length
      if (match) {
        const fenceRun = match[1];
        const char = fenceRun[0];
        const length = fenceRun.length;

        if (char === openFenceChar && length >= openFenceLength) {
          // Valid closing fence
          openFenceChar = null;
          openFenceLength = 0;
        }
      }
    }
  }

  return openFenceChar !== null;
};
