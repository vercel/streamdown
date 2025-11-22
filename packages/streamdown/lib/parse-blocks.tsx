import { Lexer } from "marked";

// Regex patterns moved to top level for performance
const footnoteReferencePattern = /\[\^[^\]\s]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[^\]\s]{1,200}\]:/;
const closingTagPattern = /<\/(\w+)>/;
const openingTagPattern = /<(\w+)[\s>]/;

// Helper function to check if string starts with $$
const startsWithDoubleDollar = (str: string): boolean => {
  let i = 0;
  // Skip leading whitespace
  while (
    i < str.length &&
    (str[i] === " " || str[i] === "\t" || str[i] === "\n" || str[i] === "\r")
  ) {
    i += 1;
  }
  return i + 1 < str.length && str[i] === "$" && str[i + 1] === "$";
};

// Helper function to check if string ends with $$
const endsWithDoubleDollar = (str: string): boolean => {
  let i = str.length - 1;
  // Skip trailing whitespace
  while (
    i >= 0 &&
    (str[i] === " " || str[i] === "\t" || str[i] === "\n" || str[i] === "\r")
  ) {
    i -= 1;
  }
  return i >= 1 && str[i] === "$" && str[i - 1] === "$";
};

// Helper function to count $$ occurrences
const countDoubleDollars = (str: string): number => {
  let count = 0;
  for (let i = 0; i < str.length - 1; i += 1) {
    if (str[i] === "$" && str[i + 1] === "$") {
      count += 1;
      i += 1; // Skip next character
    }
  }
  return count;
};

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex parsing logic that handles multiple markdown edge cases"
export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  // Check if the markdown contains footnotes (references or definitions)
  // Footnote references: [^1], [^label], etc.
  // Footnote definitions: [^1]: text, [^label]: text, etc.
  // Use atomic groups or possessive quantifiers to prevent backtracking
  const hasFootnoteReference = footnoteReferencePattern.test(markdown);
  const hasFootnoteDefinition = footnoteDefinitionPattern.test(markdown);

  // If footnotes are present, return the entire document as a single block
  // This ensures footnote references and definitions remain in the same mdast tree
  if (hasFootnoteReference || hasFootnoteDefinition) {
    return [markdown];
  }

  const tokens = Lexer.lex(markdown, { gfm: true });

  // Post-process to merge consecutive blocks that belong together
  const mergedBlocks: string[] = [];
  const htmlStack: string[] = []; // Track opening HTML tags

  for (const token of tokens) {
    const currentBlock = token.raw;
    const mergedBlocksLen = mergedBlocks.length;

    // Check if we're inside an HTML block
    if (htmlStack.length > 0) {
      // We're inside an HTML block, merge with the previous block
      mergedBlocks[mergedBlocksLen - 1] += currentBlock;

      // Check if this token closes an HTML tag
      if (token.type === "html") {
        const closingTagMatch = currentBlock.match(closingTagPattern);
        if (closingTagMatch) {
          const closingTag = closingTagMatch[1];
          // Check if this closes the most recent opening tag
          if (htmlStack.at(-1) === closingTag) {
            htmlStack.pop();
          }
        }
      }
      continue;
    }

    // Check if this is an opening HTML block tag
    if (token.type === "html" && token.block) {
      const openingTagMatch = currentBlock.match(openingTagPattern);
      if (openingTagMatch) {
        const tagName = openingTagMatch[1];
        // Check if this is a self-closing tag or if there's a closing tag in the same block
        const hasClosingTag = currentBlock.includes(`</${tagName}>`);
        if (!hasClosingTag) {
          // This is an opening tag without a closing tag in the same block
          htmlStack.push(tagName);
        }
      }
    }

    // Optimize trim operations by checking characters directly
    const trimmedBlock = currentBlock.trim();

    // Math block merging logic (existing)
    // Check if this is a standalone $$ that might be a closing delimiter
    if (trimmedBlock === "$$" && mergedBlocksLen > 0) {
      const previousBlock = mergedBlocks[mergedBlocksLen - 1];

      // Check if the previous block starts with $$ but doesn't end with $$
      const prevStartsWith$$ = startsWithDoubleDollar(previousBlock);
      const prevDollarCount = countDoubleDollars(previousBlock);

      // If previous block has odd number of $$ and starts with $$, merge them
      if (prevStartsWith$$ && prevDollarCount % 2 === 1) {
        mergedBlocks[mergedBlocksLen - 1] = previousBlock + currentBlock;
        continue;
      }
    }

    // Check if current block ends with $$ and previous block started with $$ but didn't close
    if (mergedBlocksLen > 0 && endsWithDoubleDollar(currentBlock)) {
      const previousBlock = mergedBlocks[mergedBlocksLen - 1];

      const prevStartsWith$$ = startsWithDoubleDollar(previousBlock);
      const prevDollarCount = countDoubleDollars(previousBlock);
      const currDollarCount = countDoubleDollars(currentBlock);

      // If previous block has unclosed math (odd $$) and current block ends with $$
      // AND current block doesn't start with $$, it's likely a continuation
      if (
        prevStartsWith$$ &&
        prevDollarCount % 2 === 1 &&
        !startsWithDoubleDollar(currentBlock) &&
        currDollarCount === 1
      ) {
        mergedBlocks[mergedBlocksLen - 1] = previousBlock + currentBlock;
        continue;
      }
    }

    mergedBlocks.push(currentBlock);
  }

  return mergedBlocks;
};
