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

// Helper function to count single $ signs (excluding $$) outside of code blocks
const countSingleDollars = (text: string): number => {
  let count = 0;
  let inInlineCode = false;

  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "\\") {
      i += 1;
      continue;
    }

    if (text[i] === "`" && !isTripleBacktick(text, i)) {
      inInlineCode = !inInlineCode;
      continue;
    }

    if (!inInlineCode && text[i] === "$") {
      if (i + 1 < text.length && text[i + 1] === "$") {
        i += 1;
      } else {
        count += 1;
      }
    }
  }

  return count;
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

// Completes incomplete inline KaTeX formatting ($...$)
export const handleIncompleteInlineKatex = (text: string): string => {
  const count = countSingleDollars(text);

  if (count % 2 === 1) {
    return `${text}$`;
  }

  return text;
};
