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

// OPTIMIZATION: Counts single asterisks without split("").reduce()
// Counts single asterisks that are not part of double asterisks, not escaped, not list markers, and not word-internal
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex character counting logic with multiple edge cases"
export const countSingleAsterisks = (text: string): number => {
  let count = 0;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    if (text[index] !== "*") {
      continue;
    }

    const prevChar = index > 0 ? text[index - 1] : "";
    const nextChar = index < len - 1 ? text[index + 1] : "";

    // Skip if escaped with backslash
    if (prevChar === "\\") {
      continue;
    }

    // Skip if part of ** or ***
    if (prevChar === "*" || nextChar === "*") {
      continue;
    }

    // Skip if asterisk is word-internal (between word characters)
    if (prevChar && nextChar && isWordChar(prevChar) && isWordChar(nextChar)) {
      continue;
    }

    // Check if this is a list marker (asterisk at start of line followed by space)
    // Look backwards to find the start of the current line
    let lineStartIndex = 0;
    for (let i = index - 1; i >= 0; i -= 1) {
      if (text[i] === "\n") {
        lineStartIndex = i + 1;
        break;
      }
    }

    // Check if this asterisk is at the beginning of a line (with optional whitespace)
    let isListMarker = true;
    for (let i = lineStartIndex; i < index; i += 1) {
      if (text[i] !== " " && text[i] !== "\t") {
        isListMarker = false;
        break;
      }
    }

    if (isListMarker && (nextChar === " " || nextChar === "\t")) {
      continue;
    }

    count += 1;
  }

  return count;
};

// OPTIMIZATION: Counts single underscores without split("").reduce()
// Counts single underscores that are not part of double underscores, not escaped, and not in math blocks
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex character counting logic with multiple edge cases"
export const countSingleUnderscores = (text: string): number => {
  // OPTIMIZATION: For large texts, if there are no dollar signs, skip math block checking entirely
  const hasMathBlocks = text.includes("$");

  let count = 0;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    if (text[index] !== "_") {
      continue;
    }

    const prevChar = index > 0 ? text[index - 1] : "";
    const nextChar = index < len - 1 ? text[index + 1] : "";

    // Skip if escaped with backslash
    if (prevChar === "\\") {
      continue;
    }

    // Skip if within math block (only check if text has dollar signs)
    if (hasMathBlocks && isWithinMathBlock(text, index)) {
      continue;
    }

    // Skip if part of __
    if (prevChar === "_" || nextChar === "_") {
      continue;
    }

    // Skip if underscore is word-internal (between word characters)
    if (prevChar && nextChar && isWordChar(prevChar) && isWordChar(nextChar)) {
      continue;
    }

    count += 1;
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

// Completes incomplete italic formatting with single asterisks (*)
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex italic handling logic with multiple edge cases for markdown parsing"
export const handleIncompleteSingleAsteriskItalic = (text: string): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  const singleAsteriskMatch = text.match(singleAsteriskPattern);

  if (singleAsteriskMatch) {
    // Find the first single asterisk position (not part of ** and not word-internal)
    let firstSingleAsteriskIndex = -1;
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

        firstSingleAsteriskIndex = i;
        break;
      }
    }

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
  }

  return text;
};

// Completes incomplete italic formatting with single underscores (_)
export const handleIncompleteSingleUnderscoreItalic = (
  text: string
  // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex italic handling logic with multiple edge cases for markdown parsing"
): string => {
  // Don't process if inside a complete code block
  if (hasCompleteCodeBlock(text)) {
    return text;
  }

  const singleUnderscoreMatch = text.match(singleUnderscorePattern);

  if (singleUnderscoreMatch) {
    // Find the first single underscore position (not part of __ and not word-internal)
    let firstSingleUnderscoreIndex = -1;
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

        firstSingleUnderscoreIndex = i;
        break;
      }
    }

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
    }
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
