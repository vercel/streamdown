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

/**
 * Configuration options for the remend function.
 * All options default to `true` when not specified.
 * Set an option to `false` to disable that specific completion.
 */
export type RemendOptions = {
  /** Complete links and images (e.g., `[text](url` → `[text](streamdown:incomplete-link)`) */
  links?: boolean;
  /** Complete images (e.g., `![alt](url` → removed) */
  images?: boolean;
  /** Complete bold formatting (e.g., `**text` → `**text**`) */
  bold?: boolean;
  /** Complete italic formatting (e.g., `*text` → `*text*` or `_text` → `_text_`) */
  italic?: boolean;
  /** Complete bold-italic formatting (e.g., `***text` → `***text***`) */
  boldItalic?: boolean;
  /** Complete inline code formatting (e.g., `` `code `` → `` `code` ``) */
  inlineCode?: boolean;
  /** Complete strikethrough formatting (e.g., `~~text` → `~~text~~`) */
  strikethrough?: boolean;
  /** Complete block KaTeX math (e.g., `$$equation` → `$$equation$$`) */
  katex?: boolean;
  /** Handle incomplete setext headings to prevent misinterpretation */
  setextHeadings?: boolean;
};

// Helper to check if an option is enabled (defaults to true)
const isEnabled = (option: boolean | undefined): boolean => option !== false;

// Parses markdown text and removes incomplete tokens to prevent partial rendering
const remend = (text: string, options?: RemendOptions): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Remove trailing whitespace if it's not a double space
  let result =
    text.endsWith(" ") && !text.endsWith("  ") ? text.slice(0, -1) : text;

  // Handle incomplete setext headings first (before other processing)
  // This prevents partial list items (like "-") from being interpreted as heading underlines
  if (isEnabled(options?.setextHeadings)) {
    result = handleIncompleteSetextHeading(result);
  }

  // Handle incomplete links and images
  // Note: links and images share the same handler
  if (isEnabled(options?.links) || isEnabled(options?.images)) {
    const processedResult = handleIncompleteLinksAndImages(result);

    // If we added an incomplete link marker, don't process other formatting
    // as the content inside the link should be preserved as-is
    if (processedResult.endsWith("](streamdown:incomplete-link)")) {
      return processedResult;
    }

    result = processedResult;
  }

  // Handle various formatting completions
  // Handle triple asterisks first (most specific)
  if (isEnabled(options?.boldItalic)) {
    result = handleIncompleteBoldItalic(result);
  }
  if (isEnabled(options?.bold)) {
    result = handleIncompleteBold(result);
  }
  if (isEnabled(options?.italic)) {
    result = handleIncompleteDoubleUnderscoreItalic(result);
    result = handleIncompleteSingleAsteriskItalic(result);
    result = handleIncompleteSingleUnderscoreItalic(result);
  }
  if (isEnabled(options?.inlineCode)) {
    result = handleIncompleteInlineCode(result);
  }
  if (isEnabled(options?.strikethrough)) {
    result = handleIncompleteStrikethrough(result);
  }

  // Handle KaTeX formatting (only block math with $$)
  if (isEnabled(options?.katex)) {
    result = handleIncompleteBlockKatex(result);
  }
  // Note: We don't handle inline KaTeX with single $ as they're likely currency symbols

  return result;
};

export default remend;
