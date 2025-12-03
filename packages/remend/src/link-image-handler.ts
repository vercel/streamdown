import { isInsideCodeBlock } from "./code-block-utils";
import {
  findMatchingClosingBracket,
  findMatchingOpeningBracket,
} from "./utils";

// Helper function to handle incomplete URLs in links/images
const handleIncompleteUrl = (
  text: string,
  lastParenIndex: number
): string | null => {
  const afterParen = text.substring(lastParenIndex + 2);
  if (afterParen.includes(")")) {
    return null;
  }

  // We have an incomplete URL like [text](partial-url
  // Now find the matching opening bracket for the ] before (
  const openBracketIndex = findMatchingOpeningBracket(text, lastParenIndex);

  if (openBracketIndex === -1 || isInsideCodeBlock(text, openBracketIndex)) {
    return null;
  }

  // Check if there's a ! before the [
  const isImage = openBracketIndex > 0 && text[openBracketIndex - 1] === "!";
  const startIndex = isImage ? openBracketIndex - 1 : openBracketIndex;

  // Extract everything before this link/image
  const beforeLink = text.substring(0, startIndex);

  if (isImage) {
    // For images with incomplete URLs, remove them entirely
    return beforeLink;
  }

  // For links with incomplete URLs, replace the URL with placeholder and close it
  const linkText = text.substring(openBracketIndex + 1, lastParenIndex);
  return `${beforeLink}[${linkText}](streamdown:incomplete-link)`;
};

// Helper function to handle incomplete link text (unclosed brackets)
const handleIncompleteText = (text: string, i: number): string | null => {
  // Check if there's a ! before it
  const isImage = i > 0 && text[i - 1] === "!";
  const openIndex = isImage ? i - 1 : i;

  // Check if we have a closing bracket after this
  const afterOpen = text.substring(i + 1);
  if (!afterOpen.includes("]")) {
    // This is an incomplete link/image
    const beforeLink = text.substring(0, openIndex);

    if (isImage) {
      // For images, we remove them as they can't show skeleton
      return beforeLink;
    }

    // For links, preserve the text and close the link with a
    // special placeholder URL that indicates it's incomplete
    return `${text}](streamdown:incomplete-link)`;
  }

  // If we found a closing bracket, we need to check if it's the matching one
  // (accounting for nested brackets)
  const closingIndex = findMatchingClosingBracket(text, i);
  if (closingIndex === -1) {
    // No matching closing bracket
    const beforeLink = text.substring(0, openIndex);

    if (isImage) {
      return beforeLink;
    }

    return `${text}](streamdown:incomplete-link)`;
  }

  return null;
};

// Handles incomplete links and images by preserving them with a special marker
export const handleIncompleteLinksAndImages = (text: string): string => {
  // Look for patterns like [text]( or ![text]( at the end of text
  // We need to handle nested brackets in the link text

  // Start from the end and look for ]( pattern
  const lastParenIndex = text.lastIndexOf("](");
  if (lastParenIndex !== -1 && !isInsideCodeBlock(text, lastParenIndex)) {
    const result = handleIncompleteUrl(text, lastParenIndex);
    if (result !== null) {
      return result;
    }
  }

  // Then check for incomplete link text: [partial-text without closing ]
  // Search backwards for an opening bracket that doesn't have a matching closing bracket
  for (let i = text.length - 1; i >= 0; i -= 1) {
    if (text[i] === "[" && !isInsideCodeBlock(text, i)) {
      const result = handleIncompleteText(text, i);
      if (result !== null) {
        return result;
      }
    }
  }

  return text;
};
