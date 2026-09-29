import { whitespaceOrMarkersPattern } from "./patterns";
import { getScan } from "./scan";

// Completes an unclosed inline code span (`)
//
// A span opened by a run of N backticks closes only on a run of exactly N,
// so the completion appends whatever remains of the closing run. If the text
// already ends with a partial closing run of k < N backticks, only N - k are
// appended.
export const handleIncompleteInlineCode = (text: string): string => {
  const scan = getScan(text);

  // Inside an unterminated fenced code block, backticks are content and the
  // block is left for the renderer to display as streaming code
  if (scan.openFence) {
    return text;
  }

  const span = scan.openSpan;
  if (!span) {
    return text;
  }

  // Don't close if there's no meaningful content after the opening run
  const content = text.slice(span.start + span.runLength);
  if (!content || whitespaceOrMarkersPattern.test(content)) {
    return text;
  }

  // A trailing backtick run is the closing run being streamed
  let trailingRun = 0;
  let i = text.length - 1;
  while (i >= 0 && text[i] === "`") {
    trailingRun += 1;
    i -= 1;
  }

  // A trailing run at least as long as the opener is a literal run inside
  // the span. Appending backticks would only extend it, never close the span.
  if (trailingRun >= span.runLength) {
    return text;
  }

  return text + "`".repeat(span.runLength - trailingRun);
};
