import { countSingleBackticks } from "./code-block-utils";
import {
  inlineCodePattern,
  inlineTripleBacktickPattern,
  whitespaceOrMarkersPattern,
} from "./patterns";

// Helper function to check for incomplete inline triple backticks
const handleInlineTripleBackticks = (text: string): string | null => {
  const inlineTripleBacktickMatch = text.match(inlineTripleBacktickPattern);
  if (!inlineTripleBacktickMatch || text.includes("\n")) {
    return null;
  }

  // Check if it ends with exactly 2 backticks (incomplete)
  if (text.endsWith("``") && !text.endsWith("```")) {
    return `${text}\``;
  }
  // Already complete inline triple backticks
  return text;
};

// Helper function to check if we're inside an incomplete code block
const isInsideIncompleteCodeBlock = (text: string): boolean => {
  const allTripleBackticks = (text.match(/```/g) || []).length;
  return allTripleBackticks % 2 === 1;
};

// Completes incomplete inline code formatting (`)
// Avoids completing if inside an incomplete code block
export const handleIncompleteInlineCode = (text: string): string => {
  // Check if we have inline triple backticks (starts with ``` and should end with ```)
  // This pattern should ONLY match truly inline code (no newlines)
  // Examples: ```code``` or ```python code```
  const inlineResult = handleInlineTripleBackticks(text);
  if (inlineResult !== null) {
    return inlineResult;
  }

  const inlineCodeMatch = text.match(inlineCodePattern);

  if (inlineCodeMatch && !isInsideIncompleteCodeBlock(text)) {
    // Don't close if there's no meaningful content after the opening marker
    // inlineCodeMatch[2] contains the content after `
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = inlineCodeMatch[2];
    if (
      !contentAfterMarker ||
      whitespaceOrMarkersPattern.test(contentAfterMarker)
    ) {
      return text;
    }

    const singleBacktickCount = countSingleBackticks(text);
    if (singleBacktickCount % 2 === 1) {
      return `${text}\``;
    }
  }

  return text;
};
