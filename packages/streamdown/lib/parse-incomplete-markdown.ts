/**
 * Handles incomplete links and images by removing them if not closed
 */
function handleIncompleteLinksAndImages(text: string): string {
  const linkImagePattern = /(!?\[)([^\]]*?)$/;
  const linkMatch = text.match(linkImagePattern);

  if (linkMatch) {
    const startIndex = text.lastIndexOf(linkMatch[1]);
    return text.substring(0, startIndex);
  }

  return text;
}

/**
 * Completes incomplete bold formatting (**)
 */
function handleIncompleteBold(text: string): string {
  const boldPattern = /(\*\*)([^*]*?)$/;
  const boldMatch = text.match(boldPattern);

  if (boldMatch) {
    const asteriskPairs = (text.match(/\*\*/g) || []).length;
    if (asteriskPairs % 2 === 1) {
      return `${text}**`;
    }
  }

  return text;
}

/**
 * Completes incomplete italic formatting with double underscores (__)
 */
function handleIncompleteDoubleUnderscoreItalic(text: string): string {
  const italicPattern = /(__)([^_]*?)$/;
  const italicMatch = text.match(italicPattern);

  if (italicMatch) {
    const underscorePairs = (text.match(/__/g) || []).length;
    if (underscorePairs % 2 === 1) {
      return `${text}__`;
    }
  }

  return text;
}

/**
 * Counts single asterisks that are not part of double asterisks
 */
function countSingleAsterisks(text: string): number {
  return text.split('').reduce((acc, char, index) => {
    if (char === '*') {
      const prevChar = text[index - 1];
      const nextChar = text[index + 1];
      if (prevChar !== '*' && nextChar !== '*') {
        return acc + 1;
      }
    }
    return acc;
  }, 0);
}

/**
 * Completes incomplete italic formatting with single asterisks (*)
 */
function handleIncompleteSingleAsteriskItalic(text: string): string {
  const singleAsteriskPattern = /(\*)([^*]*?)$/;
  const singleAsteriskMatch = text.match(singleAsteriskPattern);

  if (singleAsteriskMatch) {
    const singleAsterisks = countSingleAsterisks(text);
    if (singleAsterisks % 2 === 1) {
      return `${text}*`;
    }
  }

  return text;
}

/**
 * Counts single underscores that are not part of double underscores
 */
function countSingleUnderscores(text: string): number {
  return text.split('').reduce((acc, char, index) => {
    if (char === '_') {
      const prevChar = text[index - 1];
      const nextChar = text[index + 1];
      if (prevChar !== '_' && nextChar !== '_') {
        return acc + 1;
      }
    }
    return acc;
  }, 0);
}

/**
 * Completes incomplete italic formatting with single underscores (_)
 */
function handleIncompleteSingleUnderscoreItalic(text: string): string {
  const singleUnderscorePattern = /(_)([^_]*?)$/;
  const singleUnderscoreMatch = text.match(singleUnderscorePattern);

  if (singleUnderscoreMatch) {
    const singleUnderscores = countSingleUnderscores(text);
    if (singleUnderscores % 2 === 1) {
      return `${text}_`;
    }
  }

  return text;
}

/**
 * Checks if a backtick at position i is part of a triple backtick sequence
 */
function isPartOfTripleBacktick(text: string, i: number): boolean {
  const isTripleStart = text.substring(i, i + 3) === '```';
  const isTripleMiddle = i > 0 && text.substring(i - 1, i + 2) === '```';
  const isTripleEnd = i > 1 && text.substring(i - 2, i + 1) === '```';

  return isTripleStart || isTripleMiddle || isTripleEnd;
}

/**
 * Counts single backticks that are not part of triple backticks
 */
function countSingleBackticks(text: string): number {
  let count = 0;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '`' && !isPartOfTripleBacktick(text, i)) {
      count++;
    }
  }
  return count;
}

/**
 * Completes incomplete inline code formatting (`)
 * Avoids completing if inside an incomplete code block
 */
function handleIncompleteInlineCode(text: string): string {
  const inlineCodePattern = /(`)([^`]*?)$/;
  const inlineCodeMatch = text.match(inlineCodePattern);

  if (inlineCodeMatch) {
    const allTripleBackticks = (text.match(/```/g) || []).length;
    const insideIncompleteCodeBlock = allTripleBackticks % 2 === 1;

    if (!insideIncompleteCodeBlock) {
      const singleBacktickCount = countSingleBackticks(text);
      if (singleBacktickCount % 2 === 1) {
        return `${text}\``;
      }
    }
  }

  return text;
}

/**
 * Completes incomplete strikethrough formatting (~~)
 */
function handleIncompleteStrikethrough(text: string): string {
  const strikethroughPattern = /(~~)([^~]*?)$/;
  const strikethroughMatch = text.match(strikethroughPattern);

  if (strikethroughMatch) {
    const tildePairs = (text.match(/~~/g) || []).length;
    if (tildePairs % 2 === 1) {
      return `${text}~~`;
    }
  }

  return text;
}

/**
 * Parses markdown text and removes incomplete tokens to prevent partial rendering
 * of links, images, bold, and italic formatting during streaming.
 */
export const parseIncompleteMarkdown = (text: string): string => {
  if (!text || typeof text !== 'string') {
    return text;
  }

  let result = text;

  // Handle incomplete links and images first (removes content)
  result = handleIncompleteLinksAndImages(result);

  // Handle various formatting completions
  result = handleIncompleteBold(result);
  result = handleIncompleteDoubleUnderscoreItalic(result);
  result = handleIncompleteSingleAsteriskItalic(result);
  result = handleIncompleteSingleUnderscoreItalic(result);
  result = handleIncompleteInlineCode(result);
  result = handleIncompleteStrikethrough(result);

  return result;
};
