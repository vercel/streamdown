import { findInlineBlockStart } from "./inline-block";
import { whitespaceOrMarkersPattern } from "./patterns";
import { getScan } from "./scan";
import { isWhitespaceChar } from "./utils";

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

  // A code span can't cross into another block, so an opener before the
  // last one stays a literal backtick
  const span = scan.openSpan;
  if (!span || span.start < findInlineBlockStart(scan)) {
    return text;
  }

  // The closing run goes before trailing whitespace, since one after a
  // trailing newline would start a new line and could open a fence
  let end = text.length;
  while (end > 0 && isWhitespaceChar(text[end - 1])) {
    end -= 1;
  }

  // Don't close if there's no meaningful content after the opening run
  const content = text.slice(span.start + span.runLength, end);
  if (!content || whitespaceOrMarkersPattern.test(content)) {
    return text;
  }

  // A trailing backtick run is the closing run being streamed
  let trailingRun = 0;
  let i = end - 1;
  while (i >= 0 && text[i] === "`") {
    trailingRun += 1;
    i -= 1;
  }

  // A trailing run at least as long as the opener is a literal run inside
  // the span. Appending backticks would only extend it, never close the span.
  if (trailingRun >= span.runLength) {
    return text;
  }

  // Completing a run that starts its line with three or more backticks would
  // open a fence, so a full closer goes after a space instead
  const runStart = end - trailingRun;
  const lineStart = text.lastIndexOf("\n", runStart - 1) + 1;
  const opensFence =
    trailingRun > 0 &&
    span.runLength >= 3 &&
    text.slice(lineStart, runStart).trim() === "";
  const closer = opensFence
    ? ` ${"`".repeat(span.runLength)}`
    : "`".repeat(span.runLength - trailingRun);

  return text.slice(0, end) + closer + text.slice(end);
};
