import { isInsideCodeBlock } from "./code-block-utils";
import { getScan, REGION } from "./scan";
import { isWithinMathBlock } from "./utils";

// Matches an incomplete HTML tag at the end of the string.
// Must start with < followed by a letter (opening tag) or / (closing tag),
// and must NOT contain a > (which would close the tag).
const incompleteHtmlTagPattern = /<[a-zA-Z/][^>]*$/;

const tagNameStartPattern = /[a-zA-Z/]/;

const hasMathDelimiters = (text: string): boolean =>
  text.includes("$") || text.includes("\\(") || text.includes("\\[");

const startsTag = (text: string, index: number): boolean => {
  const nextChar = text[index + 1];
  return nextChar !== undefined && tagNameStartPattern.test(nextChar);
};

export const handleIncompleteHtmlTag = (text: string): string => {
  const match = text.match(incompleteHtmlTagPattern);

  if (!match || match.index === undefined) {
    return text;
  }

  // The pattern is leftmost-matching and always runs to the end of the string,
  // so every later < that starts a tag name is an equally valid candidate.
  // Walk forward until we find one that is not inside code or math: a comparison
  // operator such as \sum_{j<k} must not swallow the rest of the message.
  const checkMath = hasMathDelimiters(text);

  for (let index = match.index; index < text.length; index += 1) {
    if (text[index] !== "<" || !startsTag(text, index)) {
      continue;
    }

    if (isInsideCodeBlock(text, index)) {
      continue;
    }

    if (checkMath && isWithinMathBlock(text, index)) {
      continue;
    }

    const scan = getScan(text);
    // An incomplete tag cannot consume an opaque region later in the source.
    if (scan.regions.indexOf(REGION.LITERAL, index) !== -1) {
      continue;
    }

    // Trim only prose whitespace: the preceding literal owns its final bytes.
    const trimmedEnd = text.substring(0, index).trimEnd().length;
    const literalEnd = scan.regions.lastIndexOf(REGION.LITERAL, index - 1) + 1;
    return text.substring(0, Math.max(trimmedEnd, literalEnd));
  }

  return text;
};
