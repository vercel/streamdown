import {
  countSingleBackticks,
  isPartOfTripleBacktick,
} from "./code-block-utils.js";
import {
  inlineCodePattern,
  inlineTripleBacktickPattern,
  whitespaceOrMarkersPattern,
} from "./patterns.js";

// Completes incomplete inline code formatting (`)
// Avoids completing if inside an incomplete code block
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex inline code handling logic with multiple edge cases for markdown parsing"
export const handleIncompleteInlineCode = (text: string): string => {
  // Check if we have inline triple backticks (starts with ``` and should end with ```)
  // This pattern should ONLY match truly inline code (no newlines)
  // Examples: ```code``` or ```python code```
  const inlineTripleBacktickMatch = text.match(inlineTripleBacktickPattern);
  if (inlineTripleBacktickMatch && !text.includes("\n")) {
    // Check if it ends with exactly 2 backticks (incomplete)
    if (text.endsWith("``") && !text.endsWith("```")) {
      return `${text}\``;
    }
    // Already complete inline triple backticks
    return text;
  }

  // Check if we're inside a multi-line code block (complete or incomplete)
  const allTripleBackticks = (text.match(/```/g) || []).length;
  const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

  // Don't modify text if we have complete multi-line code blocks (even pairs of ```)
  if (
    allTripleBackticks > 0 &&
    allTripleBackticks % 2 === 0 &&
    text.includes("\n")
  ) {
    // We have complete multi-line code blocks, don't add any backticks
    return text;
  }

  // Special case: if text ends with ```\n (triple backticks followed by newline)
  // This is actually a complete code block, not incomplete
  if (
    (text.endsWith("```\n") || text.endsWith("```")) &&
    allTripleBackticks % 2 === 0
  ) {
    // Count all triple backticks - if even, it's complete
    return text;
  }

  const inlineCodeMatch = text.match(inlineCodePattern);

  if (inlineCodeMatch && !insideIncompleteCodeBlock) {
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
