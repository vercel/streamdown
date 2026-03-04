import { isInsideCodeBlock } from "./code-block-utils";
import {
  findMatchingClosingBracket,
  findMatchingOpeningBracket,
} from "./utils";

export type LinkMode = "protocol" | "text-only";

// Helper function to handle incomplete URLs in links/images
const handleIncompleteUrl = (
  text: string,
  lastParenIndex: number,
  linkMode: LinkMode
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

  // For links with incomplete URLs, handle based on linkMode
  const linkText = text.substring(openBracketIndex + 1, lastParenIndex);
  if (linkMode === "text-only") {
    return `${beforeLink}${linkText}`;
  }
  return `${beforeLink}[${linkText}](streamdown:incomplete-link)`;
};

// Helper to find the first incomplete [ (for text-only mode)
// Always returns a valid index since callers guarantee text[maxPos] is an incomplete [
const findFirstIncompleteBracket = (text: string, maxPos: number): number => {
  for (let j = 0; j < maxPos; j++) {
    if (text[j] === "[" && !isInsideCodeBlock(text, j)) {
      // Skip if it's an image
      if (j > 0 && text[j - 1] === "!") {
        continue;
      }
      // Check if this [ has a matching ]
      const closingIdx = findMatchingClosingBracket(text, j);
      if (closingIdx === -1) {
        // This is an incomplete [
        return j;
      }
      // This [ is complete, check if it's a full link [text](url)
      if (closingIdx + 1 < text.length && text[closingIdx + 1] === "(") {
        const urlEnd = text.indexOf(")", closingIdx + 2);
        if (urlEnd !== -1) {
          // Skip past this complete link
          j = urlEnd;
        }
      }
    }
  }
  // Fallback: the bracket at maxPos is always incomplete by contract
  return maxPos;
};

// Helper function to handle incomplete link text (unclosed brackets)
const handleIncompleteText = (
  text: string,
  i: number,
  linkMode: LinkMode
): string | null => {
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

    // For links, handle based on linkMode
    if (linkMode === "text-only") {
      // Find the first incomplete [ and strip just that bracket
      const firstIncomplete = findFirstIncompleteBracket(text, i);
      return (
        text.substring(0, firstIncomplete) + text.substring(firstIncomplete + 1)
      );
    }
    // Preserve the text and close the link with a placeholder URL
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

    if (linkMode === "text-only") {
      // Find the first incomplete [ and strip just that bracket
      const firstIncomplete = findFirstIncompleteBracket(text, i);
      return (
        text.substring(0, firstIncomplete) + text.substring(firstIncomplete + 1)
      );
    }
    return `${text}](streamdown:incomplete-link)`;
  }

  return null;
};

// Handles incomplete links and images by preserving them with a special marker
export const handleIncompleteLinksAndImages = (
  text: string,
  linkMode: LinkMode = "protocol"
): string => {
  // Look for patterns like [text]( or ![text]( at the end of text
  // We need to handle nested brackets in the link text

  // Start from the end and look for ]( pattern
  const lastParenIndex = text.lastIndexOf("](");
  if (lastParenIndex !== -1 && !isInsideCodeBlock(text, lastParenIndex)) {
    const result = handleIncompleteUrl(text, lastParenIndex, linkMode);
    if (result !== null) {
      return result;
    }
  }

  // Then check for incomplete link text: [partial-text without closing ]
  // Search backwards for an opening bracket that doesn't have a matching closing bracket
  for (let i = text.length - 1; i >= 0; i -= 1) {
    if (text[i] === "[" && !isInsideCodeBlock(text, i)) {
      const result = handleIncompleteText(text, i, linkMode);
      if (result !== null) {
        return result;
      }
    }
  }

  return text;
};
