import {
  isInsideCodeBlock,
  isWithinCompleteInlineCode,
} from "./code-block-utils";
import {
  doubleTildeGlobalPattern,
  halfCompleteTildePattern,
  strikethroughPattern,
  whitespaceOrMarkersPattern,
} from "./patterns";

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

    // doubleTildeGlobalPattern always matches when strikethroughPattern matched
    const tildePairs = text.match(doubleTildeGlobalPattern)?.length;
    if (tildePairs % 2 === 1) {
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
      // doubleTildeGlobalPattern always matches when halfCompleteTildePattern matched
      const tildePairs = text.match(doubleTildeGlobalPattern)?.length;
      if (tildePairs % 2 === 1) {
        return `${text}~`;
      }
    }
  }

  return text;
};
