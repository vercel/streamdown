import {
  boldItalicPattern,
  boldPattern,
  fourOrMoreAsterisksPattern,
  italicPattern,
  listItemPattern,
  singleAsteriskPattern,
  singleUnderscorePattern,
  whitespaceOrMarkersPattern,
} from "./patterns";
import { hasCompleteCodeBlock, isWithinMathBlock, isWordChar } from "./utils";

// Helper function to check if an asterisk at the given index is a list marker
const isAsteriskListMarker = (
  text: string,
  index: number,
  nextChar: string
): boolean => {
  if (nextChar !== " " && nextChar !== "\t") {
    return false;
  }

  // Look backwards to find the start of the current line
  let lineStartIndex = 0;
  for (let i = index - 1; i >= 0; i -= 1) {
    if (text[i] === "\n") {
      lineStartIndex = i + 1;
      break;
    }
  }

  // Check if this asterisk is at the beginning of a line (with optional whitespace)
  for (let i = lineStartIndex; i < index; i += 1) {
    if (text[i] !== " " && text[i] !== "\t") {
      return false;
    }
  }

  return true;
};

// Helper function to check if an asterisk should be skipped
const shouldSkipAsterisk = (
  text: string,
  index: number,
  prevChar: string,
  nextChar: string
): boolean => {
  // Skip if escaped with backslash
  if (prevChar === "\\") {
    return true;
  }

  // Skip if part of ** or ***
  if (prevChar === "*" || nextChar === "*") {
    return true;
  }

  // Skip if asterisk is word-internal (between word characters)
  if (prevChar && nextChar && isWordChar(prevChar) && isWordChar(nextChar)) {
    return true;
  }

  // Skip if this is a list marker
  if (isAsteriskListMarker(text, index, nextChar)) {
    return true;
  }

  return false;
};

// OPTIMIZATION: Counts single asterisks without split("").reduce()
// Counts single asterisks that are not part of double asterisks, not escaped, not list markers, and not word-internal
export const countSingleAsterisks = (text: string): number => {
  let count = 0;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    if (text[index] !== "*") {
      continue;
    }

    const prevChar = index > 0 ? text[index - 1] : "";
    const nextChar = index < len - 1 ? text[index + 1] : "";

    if (!shouldSkipAsterisk(text, index, prevChar, nextChar)) {
      count += 1;
    }
  }

  return count;
};

// Helper function to check if an underscore should be skipped
const shouldSkipUnderscore = (
  text: string,
  index: number,
  prevChar: string,
  nextChar: string
): boolean => {
  // Skip if escaped with backslash
  if (prevChar === "\\") {
    return true;
  }

  // Skip if within math block (only check if text has dollar signs)
  const hasMathBlocks = text.includes("$");
  if (hasMathBlocks && isWithinMathBlock(text, index)) {
    return true;
  }

  // Skip if part of __
  if (prevChar === "_" || nextChar === "_") {
    return true;
  }

  // Skip if underscore is word-internal (between word characters)
  if (prevChar && nextChar && isWordChar(prevChar) && isWordChar(nextChar)) {
    return true;
  }

  return false;
};

// OPTIMIZATION: Counts single underscores without split("").reduce()
// Counts single underscores that are not part of double underscores, not escaped, and not in math blocks
export const countSingleUnderscores = (text: string): number => {
  let count = 0;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    if (text[index] !== "_") {
      continue;
    }

    const prevChar = index > 0 ? text[index - 1] : "";
    const nextChar = index < len - 1 ? text[index + 1] : "";

    if (!shouldSkipUnderscore(text, index, prevChar, nextChar)) {
      count += 1;
    }
  }

  return count;
};

// Counts triple asterisks that are not part of quadruple or more asterisks
// OPTIMIZATION: Count *** without regex to avoid allocation
export const countTripleAsterisks = (text: string): number => {
  let count = 0;
  let consecutiveAsterisks = 0;

  // biome-ignore lint/style/useForOf: "Need index access to check character codes for performance"
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "*") {
      consecutiveAsterisks += 1;
    } else {
      // End of asterisk sequence
      if (consecutiveAsterisks >= 3) {
        count += Math.floor(consecutiveAsterisks / 3);
      }
      consecutiveAsterisks = 0;
    }
  }

  // Handle trailing asterisks
  if (consecutiveAsterisks >= 3) {
    count += Math.floor(consecutiveAsterisks / 3);
  }

  return count;
};

// Completes incomplete bold formatting (**)
export const handleIncompleteBold = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  const boldMatch = text.match(boldPattern);

  if (boldMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // boldMatch[2] contains the content after **
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = boldMatch[2];
    if (
      !contentAfterMarker ||
      whitespaceOrMarkersPattern.test(contentAfterMarker)
    ) {
      return text;
    }

    // Check if the bold marker is in a list item context
    // Find the position of the matched bold marker
    const markerIndex = text.lastIndexOf(boldMatch[1]);
    const beforeMarker = text.substring(0, markerIndex);
    const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n");
    const lineStart =
      lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1;
    const lineBeforeMarker = text.substring(lineStart, markerIndex);

    // Check if this line is a list item with just the bold marker
    if (listItemPattern.test(lineBeforeMarker)) {
      // This is a list item with just emphasis markers
      // Check if content after marker spans multiple lines
      const hasNewlineInContent = contentAfterMarker.includes("\n");
      if (hasNewlineInContent) {
        // Don't complete if the content spans to another line
        return text;
      }
    }

    const asteriskPairs = (text.match(/\*\*/g) || []).length;
    if (asteriskPairs % 2 === 1) {
      return `${text}**`;
    }
  }

  return text;
};

// Completes incomplete italic formatting with double underscores (__)
export const handleIncompleteDoubleUnderscoreItalic = (
  text: string
): string => {
  const italicMatch = text.match(italicPattern);

  if (italicMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // italicMatch[2] contains the content after __
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = italicMatch[2];
    if (
      !contentAfterMarker ||
      whitespaceOrMarkersPattern.test(contentAfterMarker)
    ) {
      return text;
    }

    // Check if the underscore marker is in a list item context
    // Find the position of the matched underscore marker
    const markerIndex = text.lastIndexOf(italicMatch[1]);
    const beforeMarker = text.substring(0, markerIndex);
    const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n");
    const lineStart =
      lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1;
    const lineBeforeMarker = text.substring(lineStart, markerIndex);

    // Check if this line is a list item with just the underscore marker
    if (listItemPattern.test(lineBeforeMarker)) {
      // This is a list item with just emphasis markers
      // Check if content after marker spans multiple lines
      const hasNewlineInContent = contentAfterMarker.includes("\n");
      if (hasNewlineInContent) {
        // Don't complete if the content spans to another line
        return text;
      }
    }

    const underscorePairs = (text.match(/__/g) || []).length;
    if (underscorePairs % 2 === 1) {
      return `${text}__`;
    }
  }

  return text;
};

// Helper function to find the first single asterisk index
const findFirstSingleAsteriskIndex = (text: string): number => {
  for (let i = 0; i < text.length; i += 1) {
    if (
      text[i] === "*" &&
      text[i - 1] !== "*" &&
      text[i + 1] !== "*" &&
      text[i - 1] !== "\\"
    ) {
      // Check if asterisk is word-internal (between word characters)
      const prevChar = i > 0 ? text[i - 1] : "";
      const nextChar = i < text.length - 1 ? text[i + 1] : "";
      if (
        prevChar &&
        nextChar &&
        isWordChar(prevChar) &&
        isWordChar(nextChar)
      ) {
        continue;
      }

      return i;
    }
  }
  return -1;
};

// Completes incomplete italic formatting with single asterisks (*)
export const handleIncompleteSingleAsteriskItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  const singleAsteriskMatch = text.match(singleAsteriskPattern);

  if (!singleAsteriskMatch) {
    return text;
  }

  const firstSingleAsteriskIndex = findFirstSingleAsteriskIndex(text);

  if (firstSingleAsteriskIndex === -1) {
    return text;
  }

  // Get content after the first single asterisk
  const contentAfterFirstAsterisk = text.substring(
    firstSingleAsteriskIndex + 1
  );

  // Check if there's meaningful content after the asterisk
  // Don't close if content is only whitespace or emphasis markers
  if (
    !contentAfterFirstAsterisk ||
    whitespaceOrMarkersPattern.test(contentAfterFirstAsterisk)
  ) {
    return text;
  }

  const singleAsterisks = countSingleAsterisks(text);
  if (singleAsterisks % 2 === 1) {
    return `${text}*`;
  }

  return text;
};

// Helper function to find the first single underscore index
const findFirstSingleUnderscoreIndex = (text: string): number => {
  for (let i = 0; i < text.length; i += 1) {
    if (
      text[i] === "_" &&
      text[i - 1] !== "_" &&
      text[i + 1] !== "_" &&
      text[i - 1] !== "\\" &&
      !isWithinMathBlock(text, i)
    ) {
      // Check if underscore is word-internal (between word characters)
      const prevChar = i > 0 ? text[i - 1] : "";
      const nextChar = i < text.length - 1 ? text[i + 1] : "";
      if (
        prevChar &&
        nextChar &&
        isWordChar(prevChar) &&
        isWordChar(nextChar)
      ) {
        continue;
      }

      return i;
    }
  }
  return -1;
};

// Helper function to insert closing underscore, handling trailing newlines
const insertClosingUnderscore = (text: string): string => {
  // If text ends with newline(s), insert underscore before them
  // Use string methods instead of regex to avoid ReDoS vulnerability
  let endIndex = text.length;
  while (endIndex > 0 && text[endIndex - 1] === "\n") {
    endIndex -= 1;
  }
  if (endIndex < text.length) {
    const textBeforeNewlines = text.slice(0, endIndex);
    const trailingNewlines = text.slice(endIndex);
    return `${textBeforeNewlines}_${trailingNewlines}`;
  }
  return `${text}_`;
};

// Completes incomplete italic formatting with single underscores (_)
export const handleIncompleteSingleUnderscoreItalic = (
  text: string
): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  const singleUnderscoreMatch = text.match(singleUnderscorePattern);

  if (!singleUnderscoreMatch) {
    return text;
  }

  const firstSingleUnderscoreIndex = findFirstSingleUnderscoreIndex(text);

  if (firstSingleUnderscoreIndex === -1) {
    return text;
  }

  // Get content after the first single underscore
  const contentAfterFirstUnderscore = text.substring(
    firstSingleUnderscoreIndex + 1
  );

  // Check if there's meaningful content after the underscore
  // Don't close if content is only whitespace or emphasis markers
  if (
    !contentAfterFirstUnderscore ||
    whitespaceOrMarkersPattern.test(contentAfterFirstUnderscore)
  ) {
    return text;
  }

  const singleUnderscores = countSingleUnderscores(text);
  if (singleUnderscores % 2 === 1) {
    return insertClosingUnderscore(text);
  }

  return text;
};

// Completes incomplete bold-italic formatting (***)
export const handleIncompleteBoldItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  // Don't process if text is only asterisks and has 4 or more consecutive asterisks
  // This prevents cases like **** from being treated as incomplete ***
  if (fourOrMoreAsterisksPattern.test(text)) {
    return text;
  }

  const boldItalicMatch = text.match(boldItalicPattern);

  if (boldItalicMatch) {
    // Don't close if there's no meaningful content after the opening markers
    // boldItalicMatch[2] contains the content after ***
    // Check if content is only whitespace or other emphasis markers
    const contentAfterMarker = boldItalicMatch[2];
    if (
      !contentAfterMarker ||
      whitespaceOrMarkersPattern.test(contentAfterMarker)
    ) {
      return text;
    }

    const tripleAsteriskCount = countTripleAsterisks(text);
    if (tripleAsteriskCount % 2 === 1) {
      return `${text}***`;
    }
  }

  return text;
};
