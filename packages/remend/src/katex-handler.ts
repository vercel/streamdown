// Completes incomplete block KaTeX formatting ($$)
export const handleIncompleteBlockKatex = (text: string): string => {
  // Count all $$ pairs in the text, but skip those inside inline code blocks (backticks)
  let dollarPairs = 0;
  let inInlineCode = false;

  for (let i = 0; i < text.length - 1; i += 1) {
    // Toggle inline code state on single backticks (not triple backticks)
    if (text[i] === "`") {
      // Check if it's not part of a triple backtick
      const isTriple = (i >= 2 && text.substring(i - 2, i + 1) === "```") ||
                       (i >= 1 && text.substring(i - 1, i + 2) === "```") ||
                       (i <= text.length - 3 && text.substring(i, i + 3) === "```");

      if (!isTriple) {
        inInlineCode = !inInlineCode;
      }
    }

    // Count $$ only if not inside inline code
    if (!inInlineCode && text[i] === "$" && text[i + 1] === "$") {
      dollarPairs += 1;
      i += 1; // Skip the next character since we've counted the pair
    }
  }

  // If we have an even number of $$, the block is complete
  if (dollarPairs % 2 === 0) {
    return text;
  }

  // If we have an odd number, add closing $$
  // Check if this looks like a multi-line math block (contains newlines after opening $$)
  const firstDollarIndex = text.indexOf("$$");
  const hasNewlineAfterStart =
    firstDollarIndex !== -1 && text.indexOf("\n", firstDollarIndex) !== -1;

  // For multi-line blocks, add newline before closing $$ if not present
  if (hasNewlineAfterStart && !text.endsWith("\n")) {
    return `${text}\n$$`;
  }

  // For inline blocks or when already ending with newline, just add $$
  return `${text}$$`;
};
