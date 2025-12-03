import { strikethroughPattern, whitespaceOrMarkersPattern } from "./patterns";

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

    const tildePairs = (text.match(/~~/g) || []).length;
    if (tildePairs % 2 === 1) {
      return `${text}~~`;
    }
  }

  return text;
};
