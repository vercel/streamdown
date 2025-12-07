// Handles incomplete setext heading underlines during streaming
// Setext headings use --- or === on the line below text to create headings
// During streaming, partial list items (like "-") can be misinterpreted as setext heading underlines

// Regex patterns defined at top level for performance
const DASH_ONLY_PATTERN = /^-{1,2}$/;
const DASH_WITH_SPACE_PATTERN = /^[\s]*-{1,2}[\s]+$/;
const EQUALS_ONLY_PATTERN = /^={1,2}$/;
const EQUALS_WITH_SPACE_PATTERN = /^[\s]*={1,2}[\s]+$/;

/**
 * Detects if the text ends with a potential incomplete setext heading underline
 * and adds a space to break the setext heading pattern
 */
export const handleIncompleteSetextHeading = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Find the last line of the text
  const lastNewlineIndex = text.lastIndexOf("\n");

  // If there's no newline, we can't have a setext heading
  if (lastNewlineIndex === -1) {
    return text;
  }

  const lastLine = text.substring(lastNewlineIndex + 1);
  const previousContent = text.substring(0, lastNewlineIndex);

  // Check if last line is only dashes or equals (potential setext heading underline)
  // We need to check for patterns like: "-", "--", "=", "=="
  // But NOT "---" or "===" (which are valid horizontal rules / setext headings)

  // Trim to check the actual content
  const trimmedLastLine = lastLine.trim();

  // Check if it's ONLY dashes (1 or 2) - but if there's trailing space, don't modify
  // If the last line ends with space after the dashes, it's already broken the setext heading pattern
  if (
    DASH_ONLY_PATTERN.test(trimmedLastLine) &&
    !lastLine.match(DASH_WITH_SPACE_PATTERN)
  ) {
    // Check if there's content on the previous line (required for setext heading)
    const lines = previousContent.split("\n");
    const previousLine = lines.at(-1);

    // If the previous line has content, this could be interpreted as a setext heading
    if (previousLine && previousLine.trim().length > 0) {
      // Add text to break the setext heading pattern
      // We add a zero-width space (\u200B) which breaks the pattern without being visible
      // This is better than adding a regular space which markdown parsers may still interpret
      // as a setext heading underline
      return `${text}\u200B`;
    }
  }

  // Check if it's ONLY equals (1 or 2)
  if (
    EQUALS_ONLY_PATTERN.test(trimmedLastLine) &&
    !lastLine.match(EQUALS_WITH_SPACE_PATTERN)
  ) {
    // Check if there's content on the previous line
    const lines = previousContent.split("\n");
    const previousLine = lines.at(-1);

    if (previousLine && previousLine.trim().length > 0) {
      // Add text to break the setext heading pattern
      // We add a zero-width space (\u200B) which breaks the pattern without being visible
      return `${text}\u200B`;
    }
  }

  return text;
};
