import { getScan, isCodeAt, isCompleteSpanAt } from "./scan";

// Check if a position is inside a code construct (fenced block or inline span)
export const isInsideCodeBlock = (text: string, position: number): boolean =>
  isCodeAt(getScan(text), position);

// Check if a position is within a COMPLETE inline code span (both opening and
// closing backtick runs present). Returns false for incomplete spans
// (streaming) so emphasis markers can still be completed.
export const isWithinCompleteInlineCode = (
  text: string,
  position: number
): boolean => isCompleteSpanAt(getScan(text), position);
