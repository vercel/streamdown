import { isInsideCodeBlock } from "./code-block-utils";

// Matches an incomplete HTML tag at the end of the string.
// Must start with < followed by a letter (opening tag) or / (closing tag),
// and must NOT contain a > (which would close the tag).
const incompleteHtmlTagPattern = /<[a-zA-Z/][^>]*$/;

export const handleIncompleteHtmlTag = (text: string): string => {
  const match = text.match(incompleteHtmlTagPattern);

  if (!match || match.index === undefined) {
    return text;
  }

  // Don't strip if the < is inside a code block or inline code
  if (isInsideCodeBlock(text, match.index)) {
    return text;
  }

  // Strip the incomplete tag and any trailing whitespace before it
  return text.substring(0, match.index).trimEnd();
};
