import {
  handleIncompleteBold,
  handleIncompleteBoldItalic,
  handleIncompleteDoubleUnderscoreItalic,
  handleIncompleteSingleAsteriskItalic,
  handleIncompleteSingleUnderscoreItalic,
} from "./emphasis-handlers";
import { handleIncompleteInlineCode } from "./inline-code-handler";
import { handleIncompleteBlockKatex } from "./katex-handler";
import { handleIncompleteLinksAndImages } from "./link-image-handler";
import { handleIncompleteSetextHeading } from "./setext-heading-handler";
import { handleIncompleteStrikethrough } from "./strikethrough-handler";

// Parses markdown text and removes incomplete tokens to prevent partial rendering
const remend = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Remove trailing whitespace if it's not a double space
  let result =
    text.endsWith(" ") && !text.endsWith("  ") ? text.slice(0, -1) : text;

  // Handle incomplete setext headings first (before other processing)
  // This prevents partial list items (like "-") from being interpreted as heading underlines
  result = handleIncompleteSetextHeading(result);

  // Handle incomplete links and images
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

export default remend;
