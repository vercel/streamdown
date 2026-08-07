import {
  isInsideCodeBlock,
  isWithinCompleteInlineCode,
} from "./code-block-utils";
import {
  halfCompleteTildePattern,
  strikethroughPattern,
  whitespaceOrMarkersPattern,
} from "./patterns";
import { getScan, REGION } from "./scan";

// Counts ~~ pairs outside code regions. Tilde runs that open or close a
// fence are painted as fence regions by the scanner, so a line-start ~~~
// fence never counts as strikethrough while a mid-line tilde run still does.
const countDoubleTildes = (text: string): number => {
  const scan = getScan(text);
  let count = 0;

  for (let i = 0; i < text.length; i += 1) {
    if (scan.regions[i] !== REGION.PROSE) {
      continue;
    }
    if (text[i] === "~" && i + 1 < text.length && text[i + 1] === "~") {
      count += 1;
      i += 1;
    }
  }
  return count;
};

// Completes incomplete strikethrough formatting (~~)
export const handleIncompleteStrikethrough = (text: string): string => {
  const strikethroughMatch = text.match(strikethroughPattern);

  if (strikethroughMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // strikethroughMatch[2] contains the content after ~~
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = strikethroughMatch[2];
    if (
      !contentAfterMarker ||
      whitespaceOrMarkersPattern.test(contentAfterMarker)
    ) {
      return text;
    }

    // Don't close if the marker is inside an inline code span or fenced code block
    const markerIndex = text.lastIndexOf(strikethroughMatch[1]);
    if (
      isInsideCodeBlock(text, markerIndex) ||
      isWithinCompleteInlineCode(text, markerIndex)
    ) {
      return text;
    }

    if (countDoubleTildes(text) % 2 === 1) {
      return `${text}~~`;
    }
  } else {
    // Check for half-complete closing marker: ~~content~ should become ~~content~~
    // The pattern /(~~)([^~]*?)$/ won't match ~~content~ because it ends with ~
    const halfCompleteMatch = text.match(halfCompleteTildePattern);
    if (halfCompleteMatch) {
      // Don't close if the marker is inside an inline code span or fenced code block
      const markerIndex = text.lastIndexOf(halfCompleteMatch[0].slice(0, 2));
      if (
        isInsideCodeBlock(text, markerIndex) ||
        isWithinCompleteInlineCode(text, markerIndex)
      ) {
        return text;
      }
      if (countDoubleTildes(text) % 2 === 1) {
        return `${text}~`;
      }
    }
  }

  return text;
};
