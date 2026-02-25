/**
 * Escapes markdown metacharacters inside the content of specified custom tags,
 * so that markdown inside those tags is rendered as plain text rather than
 * being interpreted as formatting.
 *
 * This must run BEFORE the markdown parser sees the string, because by the time
 * rehype plugins execute the markdown has already been parsed and structural
 * information (e.g. underscores around emphasis) is lost.
 *
 * Example:
 *   Input:  `<mention user_id="123">_some_username_</mention>`
 *   Output: `<mention user_id="123">\_some\_username\_</mention>`
 *   Rendered: literal `_some_username_`
 */

// All characters that CommonMark treats as potential markdown metacharacters
const MARKDOWN_ESCAPE_RE = /([\\`*_{}[\]()#+\-.!|~])/g;

const escapeMarkdown = (text: string): string =>
  text.replace(MARKDOWN_ESCAPE_RE, "\\$1");

/**
 * For each tag in `tagNames`, escapes markdown metacharacters inside the tag's
 * content so that the parser treats the children as plain text.
 */
export const preprocessLiteralTagContent = (
  markdown: string,
  tagNames: string[]
): string => {
  if (!tagNames.length) {
    return markdown;
  }

  let result = markdown;

  for (const tagName of tagNames) {
    const pattern = new RegExp(
      `(<${tagName}(?=[\\s>/])[^>]*>)([\\s\\S]*?)(</${tagName}\\s*>)`,
      "gi"
    );

    result = result.replace(
      pattern,
      (_match, open: string, content: string, close: string) =>
        open + escapeMarkdown(content) + close
    );
  }

  return result;
};
