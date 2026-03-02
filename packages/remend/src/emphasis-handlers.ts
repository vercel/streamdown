import {
  isInsideCodeBlock,
  isWithinCompleteInlineCode,
} from "./code-block-utils";
import {
  boldItalicPattern,
  boldPattern,
  fourOrMoreAsterisksPattern,
  halfCompleteUnderscorePattern,
  italicPattern,
  listItemPattern,
  singleAsteriskPattern,
  singleUnderscorePattern,
  whitespaceOrMarkersPattern,
} from "./patterns";
import {
  isHorizontalRule,
  isWithinHtmlTag,
  isWithinLinkOrImageUrl,
  isWithinMathBlock,
  isWordChar,
} from "./utils";

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

  // Skip if within math block (only check if text has dollar signs)
  const hasMathBlocks = text.includes("$");
  if (hasMathBlocks && isWithinMathBlock(text, index)) {
    return true;
  }

  // Special handling for *** sequences
  // If this is the first * in ***, don't skip it - it can close a single * italic
  // Example: **bold and *italic*** should count the first * of *** as closing the italic
  if (prevChar !== "*" && nextChar === "*") {
    const nextNextChar = index < text.length - 2 ? text[index + 2] : "";
    if (nextNextChar === "*") {
      // This is the first * in a *** sequence
      // Count it as a single asterisk for matching purposes
      return false;
    }
    // This is the first * in ** (not ***)
    return true;
  }

  // Skip if this is the second or third * in a sequence
  if (prevChar === "*") {
    return true;
  }

  // Skip if asterisk is word-internal (between word characters)
  if (prevChar && nextChar && isWordChar(prevChar) && isWordChar(nextChar)) {
    return true;
  }

  // Skip if flanked by whitespace on both sides (not a valid emphasis delimiter per CommonMark)
  // This also catches list markers (e.g., "* item") since they have whitespace on both sides
  const prevIsWhitespace =
    !prevChar || prevChar === " " || prevChar === "\t" || prevChar === "\n";
  const nextIsWhitespace =
    !nextChar || nextChar === " " || nextChar === "\t" || nextChar === "\n";
  if (prevIsWhitespace && nextIsWhitespace) {
    return true;
  }

  return false;
};

// OPTIMIZATION: Counts single asterisks without split("").reduce()
// Counts single asterisks that are not part of double asterisks, not escaped, not list markers, not word-internal,
// and not inside fenced code blocks
export const countSingleAsterisks = (text: string): number => {
  let count = 0;
  let inCodeBlock = false;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    // Track fenced code blocks (```)
    if (
      text[index] === "`" &&
      index + 2 < len &&
      text[index + 1] === "`" &&
      text[index + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      index += 2;
      continue;
    }

    // Skip content inside fenced code blocks
    if (inCodeBlock) {
      continue;
    }

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

  // Skip if within a link or image URL
  if (isWithinLinkOrImageUrl(text, index)) {
    return true;
  }

  // Skip if within an HTML tag (e.g. <a target="_blank">)
  if (isWithinHtmlTag(text, index)) {
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
// Counts single underscores that are not part of double underscores, not escaped, not in math blocks,
// and not inside fenced code blocks
export const countSingleUnderscores = (text: string): number => {
  let count = 0;
  let inCodeBlock = false;
  const len = text.length;

  for (let index = 0; index < len; index += 1) {
    // Track fenced code blocks (```)
    if (
      text[index] === "`" &&
      index + 2 < len &&
      text[index + 1] === "`" &&
      text[index + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      index += 2;
      continue;
    }

    // Skip content inside fenced code blocks
    if (inCodeBlock) {
      continue;
    }

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
// and not inside fenced code blocks
// OPTIMIZATION: Count *** without regex to avoid allocation
export const countTripleAsterisks = (text: string): number => {
  let count = 0;
  let consecutiveAsterisks = 0;
  let inCodeBlock = false;

  for (let i = 0; i < text.length; i += 1) {
    // Track fenced code blocks (```)
    if (
      text[i] === "`" &&
      i + 2 < text.length &&
      text[i + 1] === "`" &&
      text[i + 2] === "`"
    ) {
      // Flush any pending asterisks before toggling
      if (consecutiveAsterisks >= 3) {
        count += Math.floor(consecutiveAsterisks / 3);
      }
      consecutiveAsterisks = 0;
      inCodeBlock = !inCodeBlock;
      i += 2;
      continue;
    }

    // Skip content inside fenced code blocks
    if (inCodeBlock) {
      continue;
    }

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

// Counts ** pairs outside fenced code blocks
const countDoubleAsterisksOutsideCodeBlocks = (text: string): number => {
  let count = 0;
  let inCodeBlock = false;

  for (let i = 0; i < text.length; i += 1) {
    if (
      text[i] === "`" &&
      i + 2 < text.length &&
      text[i + 1] === "`" &&
      text[i + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      i += 2;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (text[i] === "*" && i + 1 < text.length && text[i + 1] === "*") {
      count += 1;
      i += 1;
    }
  }
  return count;
};

// Counts __ pairs outside fenced code blocks
const countDoubleUnderscoresOutsideCodeBlocks = (text: string): number => {
  let count = 0;
  let inCodeBlock = false;

  for (let i = 0; i < text.length; i += 1) {
    if (
      text[i] === "`" &&
      i + 2 < text.length &&
      text[i + 1] === "`" &&
      text[i + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      i += 2;
      continue;
    }
    if (inCodeBlock) {
      continue;
    }
    if (text[i] === "_" && i + 1 < text.length && text[i + 1] === "_") {
      count += 1;
      i += 1;
    }
  }
  return count;
};

// Helper to check if bold marker should not be completed
const shouldSkipBoldCompletion = (
  text: string,
  contentAfterMarker: string,
  markerIndex: number
): boolean => {
  if (
    !contentAfterMarker ||
    whitespaceOrMarkersPattern.test(contentAfterMarker)
  ) {
    return true;
  }

  // Check if this is in a list item with multiline content
  const beforeMarker = text.substring(0, markerIndex);
  const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n");
  const lineStart =
    lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1;
  const lineBeforeMarker = text.substring(lineStart, markerIndex);

  if (listItemPattern.test(lineBeforeMarker)) {
    const hasNewlineInContent = contentAfterMarker.includes("\n");
    if (hasNewlineInContent) {
      return true;
    }
  }

  return isHorizontalRule(text, markerIndex, "*");
};

// Completes incomplete bold formatting (**)
export const handleIncompleteBold = (text: string): string => {
  const boldMatch = text.match(boldPattern);
  if (!boldMatch) {
    return text;
  }

  const contentAfterMarker = boldMatch[2];
  const markerIndex = text.lastIndexOf(boldMatch[1]);

  // Check if the bold marker is within a code block (fenced or inline)
  if (
    isInsideCodeBlock(text, markerIndex) ||
    isWithinCompleteInlineCode(text, markerIndex)
  ) {
    return text;
  }

  if (shouldSkipBoldCompletion(text, contentAfterMarker, markerIndex)) {
    return text;
  }

  const asteriskPairs = countDoubleAsterisksOutsideCodeBlocks(text);
  if (asteriskPairs % 2 === 1) {
    // Check for half-complete closing marker: **content* should become **content**
    // The trailing * is the first char of the closing ** being streamed
    if (contentAfterMarker.endsWith("*")) {
      return `${text}*`;
    }
    return `${text}**`;
  }

  return text;
};

// Helper to check if italic marker should not be completed
const shouldSkipItalicCompletion = (
  text: string,
  contentAfterMarker: string,
  markerIndex: number
): boolean => {
  if (
    !contentAfterMarker ||
    whitespaceOrMarkersPattern.test(contentAfterMarker)
  ) {
    return true;
  }

  // Check if this is in a list item with multiline content
  const beforeMarker = text.substring(0, markerIndex);
  const lastNewlineBeforeMarker = beforeMarker.lastIndexOf("\n");
  const lineStart =
    lastNewlineBeforeMarker === -1 ? 0 : lastNewlineBeforeMarker + 1;
  const lineBeforeMarker = text.substring(lineStart, markerIndex);

  if (listItemPattern.test(lineBeforeMarker)) {
    const hasNewlineInContent = contentAfterMarker.includes("\n");
    if (hasNewlineInContent) {
      return true;
    }
  }

  return isHorizontalRule(text, markerIndex, "_");
};

// Completes incomplete italic formatting with double underscores (__)
export const handleIncompleteDoubleUnderscoreItalic = (
  text: string
): string => {
  const italicMatch = text.match(italicPattern);
  if (!italicMatch) {
    // Check for half-complete closing marker: __content_ should become __content__
    // The pattern /(__)([^_]*?)$/ won't match __content_ because it ends with _
    // So we need a separate check for this case
    const halfCompleteMatch = text.match(halfCompleteUnderscorePattern);
    if (halfCompleteMatch) {
      const markerIndex = text.lastIndexOf(halfCompleteMatch[1]);
      if (
        !(
          isInsideCodeBlock(text, markerIndex) ||
          isWithinCompleteInlineCode(text, markerIndex)
        )
      ) {
        const underscorePairs = countDoubleUnderscoresOutsideCodeBlocks(text);
        if (underscorePairs % 2 === 1) {
          return `${text}_`;
        }
      }
    }
    return text;
  }

  const contentAfterMarker = italicMatch[2];
  const markerIndex = text.lastIndexOf(italicMatch[1]);

  // Check if the italic marker is within a code block (fenced or inline)
  if (
    isInsideCodeBlock(text, markerIndex) ||
    isWithinCompleteInlineCode(text, markerIndex)
  ) {
    return text;
  }

  if (shouldSkipItalicCompletion(text, contentAfterMarker, markerIndex)) {
    return text;
  }

  const underscorePairs = countDoubleUnderscoresOutsideCodeBlocks(text);
  if (underscorePairs % 2 === 1) {
    return `${text}__`;
  }

  return text;
};

// Helper function to find the first single asterisk index (skips fenced code blocks)
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: asterisk detection requires many inline conditions
const findFirstSingleAsteriskIndex = (text: string): number => {
  let inCodeBlock = false;

  for (let i = 0; i < text.length; i += 1) {
    // Track fenced code blocks (```)
    if (
      text[i] === "`" &&
      i + 2 < text.length &&
      text[i + 1] === "`" &&
      text[i + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      i += 2;
      continue;
    }

    // Skip content inside fenced code blocks
    if (inCodeBlock) {
      continue;
    }

    if (
      text[i] === "*" &&
      text[i - 1] !== "*" &&
      text[i + 1] !== "*" &&
      text[i - 1] !== "\\" &&
      !isWithinMathBlock(text, i)
    ) {
      const prevChar = i > 0 ? text[i - 1] : "";
      const nextChar = i < text.length - 1 ? text[i + 1] : "";

      // Skip if flanked by whitespace on both sides (not a valid emphasis delimiter)
      const prevIsWs =
        !prevChar || prevChar === " " || prevChar === "\t" || prevChar === "\n";
      const nextIsWs =
        !nextChar || nextChar === " " || nextChar === "\t" || nextChar === "\n";
      if (prevIsWs && nextIsWs) {
        continue;
      }

      // Check if asterisk is word-internal (between word characters)
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
  const singleAsteriskMatch = text.match(singleAsteriskPattern);

  if (!singleAsteriskMatch) {
    return text;
  }

  const firstSingleAsteriskIndex = findFirstSingleAsteriskIndex(text);

  if (firstSingleAsteriskIndex === -1) {
    return text;
  }

  // Don't close if the marker is inside a complete inline code span or fenced code block
  if (
    isInsideCodeBlock(text, firstSingleAsteriskIndex) ||
    isWithinCompleteInlineCode(text, firstSingleAsteriskIndex)
  ) {
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

// Helper function to find the first single underscore index (skips fenced code blocks)
const findFirstSingleUnderscoreIndex = (text: string): number => {
  let inCodeBlock = false;

  for (let i = 0; i < text.length; i += 1) {
    // Track fenced code blocks (```)
    if (
      text[i] === "`" &&
      i + 2 < text.length &&
      text[i + 1] === "`" &&
      text[i + 2] === "`"
    ) {
      inCodeBlock = !inCodeBlock;
      i += 2;
      continue;
    }

    // Skip content inside fenced code blocks
    if (inCodeBlock) {
      continue;
    }

    if (
      text[i] === "_" &&
      text[i - 1] !== "_" &&
      text[i + 1] !== "_" &&
      text[i - 1] !== "\\" &&
      !isWithinMathBlock(text, i) &&
      !isWithinLinkOrImageUrl(text, i)
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

// Helper to handle trailing ** for proper nesting of _ and ** markers
const handleTrailingAsterisksForUnderscore = (text: string): string | null => {
  if (!text.endsWith("**")) {
    return null;
  }

  const textWithoutTrailingAsterisks = text.slice(0, -2);
  const asteriskPairsAfterRemoval = countDoubleAsterisksOutsideCodeBlocks(
    textWithoutTrailingAsterisks
  );

  // If removing trailing ** makes the count odd, it was added to close an unclosed **
  if (asteriskPairsAfterRemoval % 2 !== 1) {
    return null;
  }

  const firstDoubleAsteriskIndex = textWithoutTrailingAsterisks.indexOf("**");
  const underscoreIndex = findFirstSingleUnderscoreIndex(
    textWithoutTrailingAsterisks
  );

  // If ** opened before _, then _ should close before **
  if (
    firstDoubleAsteriskIndex !== -1 &&
    underscoreIndex !== -1 &&
    firstDoubleAsteriskIndex < underscoreIndex
  ) {
    return `${textWithoutTrailingAsterisks}_**`;
  }

  return null;
};

// Completes incomplete italic formatting with single underscores (_)
export const handleIncompleteSingleUnderscoreItalic = (
  text: string
): string => {
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
    // Check if we need to insert _ before trailing ** for proper nesting
    const trailingResult = handleTrailingAsterisksForUnderscore(text);
    if (trailingResult !== null) {
      return trailingResult;
    }
    return insertClosingUnderscore(text);
  }

  return text;
};

// Helper to check if bold-italic markers are already balanced
const areBoldItalicMarkersBalanced = (text: string): boolean => {
  const asteriskPairs = countDoubleAsterisksOutsideCodeBlocks(text);
  const singleAsterisks = countSingleAsterisks(text);
  return asteriskPairs % 2 === 0 && singleAsterisks % 2 === 0;
};

// Helper to check if bold-italic should be skipped
const shouldSkipBoldItalicCompletion = (
  text: string,
  contentAfterMarker: string,
  markerIndex: number
): boolean => {
  if (
    !contentAfterMarker ||
    whitespaceOrMarkersPattern.test(contentAfterMarker)
  ) {
    return true;
  }

  if (
    isInsideCodeBlock(text, markerIndex) ||
    isWithinCompleteInlineCode(text, markerIndex)
  ) {
    return true;
  }

  return isHorizontalRule(text, markerIndex, "*");
};

// Completes incomplete bold-italic formatting (***)
export const handleIncompleteBoldItalic = (text: string): string => {
  // Don't process if text is only asterisks and has 4 or more consecutive asterisks
  if (fourOrMoreAsterisksPattern.test(text)) {
    return text;
  }

  const boldItalicMatch = text.match(boldItalicPattern);

  if (!boldItalicMatch) {
    return text;
  }

  const contentAfterMarker = boldItalicMatch[2];
  const markerIndex = text.lastIndexOf(boldItalicMatch[1]);

  if (shouldSkipBoldItalicCompletion(text, contentAfterMarker, markerIndex)) {
    return text;
  }

  const tripleAsteriskCount = countTripleAsterisks(text);
  if (tripleAsteriskCount % 2 === 1) {
    // If both ** and * are balanced, don't add closing ***
    // The *** is likely overlapping markers (e.g., **bold and *italic***)
    if (areBoldItalicMarkersBalanced(text)) {
      return text;
    }
    return `${text}***`;
  }

  return text;
};
