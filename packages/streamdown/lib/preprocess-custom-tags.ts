/**
 * Preprocesses markdown to prevent blank lines inside custom tag blocks
 * from splitting the HTML block. In CommonMark, HTML blocks (types 6/7)
 * end at blank lines, which causes custom tags with blank lines in their
 * content to be split across multiple tokens. This function replaces blank
 * lines within matched custom tag pairs with HTML comments, so the markdown
 * parser treats the entire tag block as a single unit.
 */
export const preprocessCustomTags = (
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
      (_match, open: string, content: string, close: string) => {
        const fixedContent = content.replace(/\n\n/g, "\n<!---->\n");
        return open + fixedContent + close;
      }
    );
  }

  return result;
};
