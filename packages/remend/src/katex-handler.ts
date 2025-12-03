// Completes incomplete block KaTeX formatting ($$)
export const handleIncompleteBlockKatex = (text: string): string => {
  // Count all $$ pairs in the text
  const dollarPairs = (text.match(/\$\$/g) || []).length;

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
