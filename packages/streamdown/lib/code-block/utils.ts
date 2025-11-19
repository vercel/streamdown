type HighlightThrottling = {
  minHighlightInterval: number;
  debounceMs: number;
};

export const getHighlightThrottling = (
  lineCount: number
): HighlightThrottling => {
  const smallThreshold = 50;
  const mediumThreshold = 150;
  const largeThreshold = 300;
  if (lineCount < smallThreshold) {
    // Small blocks: highlight frequently
    return {
      minHighlightInterval: 100,
      debounceMs: 500,
    };
  }
  if (lineCount < mediumThreshold) {
    // Medium blocks: reduce highlight frequency
    return {
      minHighlightInterval: 500,
      debounceMs: 800,
    };
  }
  if (lineCount < largeThreshold) {
    // Large blocks: highlight rarely, rely on debounce
    return {
      minHighlightInterval: 1500,
      debounceMs: 1200,
    };
  }
  // Very large blocks: skip immediate highlights entirely during streaming
  return {
    minHighlightInterval: Number.POSITIVE_INFINITY,
    debounceMs: 1500,
  };
};

export const escapeHtml = (html: string) =>
  html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

export const splitCurrentIncompleteLineFromCode = (
  code: string
): [string, string] => {
  const lastNewLineIndex = code.lastIndexOf("\n");
  const completeCode =
    lastNewLineIndex >= 0 ? code.slice(0, lastNewLineIndex + 1) : "";
  const currentIncompleteLine =
    lastNewLineIndex >= 0 ? code.slice(lastNewLineIndex + 1) : code;
  return [completeCode, currentIncompleteLine];
};
