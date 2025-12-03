// Check if a position is inside a code block (between ``` or `)
export const isInsideCodeBlock = (text: string, position: number): boolean => {
  // Check for inline code (backticks)
  let inInlineCode = false;
  let inMultilineCode = false;

  for (let i = 0; i < position; i += 1) {
    // Check for triple backticks (multiline code blocks)
    if (text.substring(i, i + 3) === "```") {
      inMultilineCode = !inMultilineCode;
      i += 2; // Skip the next 2 backticks
      continue;
    }

    // Only check for inline code if not in multiline code
    if (!inMultilineCode && text[i] === "`") {
      inInlineCode = !inInlineCode;
    }
  }

  return inInlineCode || inMultilineCode;
};

// Checks if a backtick at position i is part of a triple backtick sequence
export const isPartOfTripleBacktick = (text: string, i: number): boolean => {
  const isTripleStart = text.substring(i, i + 3) === "```";
  const isTripleMiddle = i > 0 && text.substring(i - 1, i + 2) === "```";
  const isTripleEnd = i > 1 && text.substring(i - 2, i + 1) === "```";

  return isTripleStart || isTripleMiddle || isTripleEnd;
};

// Counts single backticks that are not part of triple backticks
export const countSingleBackticks = (text: string): number => {
  let count = 0;
  for (let i = 0; i < text.length; i += 1) {
    if (text[i] === "`" && !isPartOfTripleBacktick(text, i)) {
      count += 1;
    }
  }
  return count;
};
