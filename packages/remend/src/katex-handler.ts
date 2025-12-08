// Helper function to check if a backtick is part of a triple backtick
const isTripleBacktick = (text: string, index: number): boolean =>
  (index >= 2 && text.substring(index - 2, index + 1) === "```") ||
  (index >= 1 && text.substring(index - 1, index + 2) === "```") ||
  (index <= text.length - 3 && text.substring(index, index + 3) === "```");

// Helper function to count $$ pairs outside of inline code blocks
const countDollarPairs = (text: string): number => {
  let dollarPairs = 0;
  let inInlineCode = false;

  for (let i = 0; i < text.length - 1; i += 1) {
    if (text[i] === "`" && !isTripleBacktick(text, i)) {
      inInlineCode = !inInlineCode;
    }

    if (!inInlineCode && text[i] === "$" && text[i + 1] === "$") {
      dollarPairs += 1;
      i += 1;
    }
  }

  return dollarPairs;
};

// Helper function to add closing $$ with appropriate formatting
const addClosingKatex = (text: string): string => {
  const firstDollarIndex = text.indexOf("$$");
  const hasNewlineAfterStart =
    firstDollarIndex !== -1 && text.indexOf("\n", firstDollarIndex) !== -1;

  if (hasNewlineAfterStart && !text.endsWith("\n")) {
    return `${text}\n$$`;
  }

  return `${text}$$`;
};

// Completes incomplete block KaTeX formatting ($$)
export const handleIncompleteBlockKatex = (text: string): string => {
  const dollarPairs = countDollarPairs(text);

  if (dollarPairs % 2 === 0) {
    return text;
  }

  return addClosingKatex(text);
};
