import {
  handleIncompleteBold,
  handleIncompleteBoldItalic,
  handleIncompleteDoubleUnderscoreItalic,
  handleIncompleteSingleAsteriskItalic,
  handleIncompleteSingleUnderscoreItalic,
} from "./emphasis-handlers.js";
import { handleIncompleteInlineCode } from "./inline-code-handler.js";
import { handleIncompleteBlockKatex } from "./katex-handler.js";
import { handleIncompleteLinksAndImages } from "./link-image-handler.js";
import { handleIncompleteStrikethrough } from "./strikethrough-handler.js";

// Parses markdown text and removes incomplete tokens to prevent partial rendering
export const parseIncompleteMarkdown = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  let result = text;

  // Handle incomplete links and images first
  const processedResult = handleIncompleteLinksAndImages(result);

  // If we added an incomplete link marker, don't process other formatting
  // as the content inside the link should be preserved as-is
  if (processedResult.endsWith("](streamdown:incomplete-link)")) {
    return processedResult;
  }

  result = processedResult;

  // Handle various formatting completions
  // Handle triple asterisks first (most specific)
  result = handleIncompleteBoldItalic(result);
  result = handleIncompleteBold(result);
  result = handleIncompleteDoubleUnderscoreItalic(result);
  result = handleIncompleteSingleAsteriskItalic(result);
  result = handleIncompleteSingleUnderscoreItalic(result);
  result = handleIncompleteInlineCode(result);
  result = handleIncompleteStrikethrough(result);

  // Handle KaTeX formatting (only block math with $$)
  result = handleIncompleteBlockKatex(result);
  // Note: We don't handle inline KaTeX with single $ as they're likely currency symbols

  return result;
};
