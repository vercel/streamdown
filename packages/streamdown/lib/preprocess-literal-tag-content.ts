/**
 * Escapes markdown metacharacters inside the content of specified custom tags,
 * so that markdown inside those tags is rendered as plain text rather than
 * being interpreted as formatting.
 *
 * This must run BEFORE the markdown parser sees the string, because by the time
 * rehype plugins execute the markdown has already been parsed and structural
 * information (e.g. underscores around emphasis) is lost.
 *
 * Note: content that already contains backslash escapes (e.g. `\_`) will be
 * double-escaped and render with a visible backslash. This is acceptable since
 * the intended use case is raw data labels (usernames, handles) that should
 * not contain markdown escape sequences.
 *
 * Example:
 *   Input:  `<mention user_id="123">_some_username_</mention>`
 *   Output: `<mention user_id="123">\_some\_username\_</mention>`
 *   Rendered: literal `_some_username_`
 */

// Characters that CommonMark treats as inline formatting metacharacters.
// Only escapes characters that can trigger formatting anywhere in text:
//   \  backslash escapes
//   `  code spans
//   *  emphasis / strong
//   _  emphasis / strong
//   ~  strikethrough (GFM)
//   [  link / image start
//   ]  link / image end
//   |  table cell delimiter (GFM)
// Line-start-only syntax (headings, lists, blockquotes) is not escaped
// because tag content rarely starts lines and the rehype plugin provides
// a safety net.
const MARKDOWN_ESCAPE_RE = /([\\`*_~[\]|])/g;

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
