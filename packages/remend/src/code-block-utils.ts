import { getScan, isCodeAt, isCompleteSpanAt } from "./scan";

// A code construct here means a fenced block or an inline code span.
export const isInsideCodeBlock = (text: string, position: number): boolean =>
  isCodeAt(getScan(text), position);

// Check if a position is within a COMPLETE inline code span (both opening and
// closing backtick runs present). Returns false for incomplete spans
// (streaming) so emphasis markers can still be completed.
export const isWithinCompleteInlineCode = (
  text: string,
  position: number
): boolean => isCompleteSpanAt(getScan(text), position);
