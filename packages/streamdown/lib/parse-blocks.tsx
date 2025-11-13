import { Lexer } from "marked";

// Regex patterns
const FOOTNOTE_REFERENCE_PATTERN = /\[\^[^\]\s]{1,200}\](?!:)/;
const FOOTNOTE_DEFINITION_PATTERN = /\[\^[^\]\s]{1,200}\]:/;
const CLOSING_TAG_PATTERN = /<\/(\w+)>/;
const OPENING_TAG_PATTERN = /<(\w+)[\s>]/;

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  // Check if the markdown contains footnotes (references or definitions)
  // Footnote references: [^1], [^label], etc.
  // Footnote definitions: [^1]: text, [^label]: text, etc.
  // Use atomic groups or possessive quantifiers to prevent backtracking
  const hasFootnoteReference = FOOTNOTE_REFERENCE_PATTERN.test(markdown);
  const hasFootnoteDefinition = FOOTNOTE_DEFINITION_PATTERN.test(markdown);

  // If footnotes are present, return the entire document as a single block
  // This ensures footnote references and definitions remain in the same mdast tree
  if (hasFootnoteReference || hasFootnoteDefinition) {
    return [markdown];
  }

  const tokens = Lexer.lex(markdown, { gfm: true });

  // Post-process to merge consecutive blocks that belong together
  const mergedBlocks: string[] = [];
  const htmlStack: string[] = []; // Track opening HTML tags

  // Helper to process HTML blocks
  const processHtmlBlock = (
    token: (typeof tokens)[number],
    currentBlock: string
  ): boolean => {
    if (htmlStack.length === 0) {
      return false;
    }

    // We're inside an HTML block, merge with the previous block
    mergedBlocks[mergedBlocks.length - 1] += currentBlock;

    // Check if this token closes an HTML tag
    if (token.type === "html") {
      const closingTagMatch = currentBlock.match(CLOSING_TAG_PATTERN);
      if (closingTagMatch) {
        const closingTag = closingTagMatch[1];
        // Check if this closes the most recent opening tag
        if (htmlStack.at(-1) === closingTag) {
          htmlStack.pop();
        }
      }
    }
    return true;
  };

  // Helper to handle opening HTML tags
  const handleOpeningHtmlTag = (
    token: (typeof tokens)[number],
    currentBlock: string
  ): void => {
    if (token.type !== "html" || !token.block) {
      return;
    }

    const openingTagMatch = currentBlock.match(OPENING_TAG_PATTERN);
    if (openingTagMatch) {
      const tagName = openingTagMatch[1];
      // Check if this is a self-closing tag or if there's a closing tag in the same block
      const hasClosingTag = currentBlock.includes(`</${tagName}>`);
      if (!hasClosingTag) {
        // This is an opening tag without a closing tag in the same block
        htmlStack.push(tagName);
      }
    }
  };

  // Helper to merge standalone $$ closing delimiter
  const mergeStandaloneDollar = (currentBlock: string): boolean => {
    if (currentBlock.trim() !== "$$" || mergedBlocks.length === 0) {
      return false;
    }

    const previousBlock = mergedBlocks.at(-1);
    if (!previousBlock) {
      mergedBlocks.push(currentBlock);
      return true;
    }

    // Check if the previous block starts with $$ but doesn't end with $$
    const prevStartsWith$$ = previousBlock.trimStart().startsWith("$$");
    const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;

    // If previous block has odd number of $$ and starts with $$, merge them
    if (prevStartsWith$$ && prevDollarCount % 2 === 1) {
      mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
      return true;
    }

    return false;
  };

  // Helper to merge ending $$ continuation
  const mergeEndingDollar = (currentBlock: string): boolean => {
    if (mergedBlocks.length === 0 || !currentBlock.trimEnd().endsWith("$$")) {
      return false;
    }

    const previousBlock = mergedBlocks.at(-1);
    if (!previousBlock) {
      mergedBlocks.push(currentBlock);
      return true;
    }

    const prevStartsWith$$ = previousBlock.trimStart().startsWith("$$");
    const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;
    const currDollarCount = (currentBlock.match(/\$\$/g) || []).length;

    // If previous block has unclosed math (odd $$) and current block ends with $$
    // AND current block doesn't start with $$, it's likely a continuation
    if (
      prevStartsWith$$ &&
      prevDollarCount % 2 === 1 &&
      !currentBlock.trimStart().startsWith("$$") &&
      currDollarCount === 1
    ) {
      mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
      return true;
    }

    return false;
  };

  // Helper to merge math blocks
  const mergeMathBlocks = (currentBlock: string): boolean => {
    if (mergeStandaloneDollar(currentBlock)) {
      return true;
    }
    return mergeEndingDollar(currentBlock);
  };

  for (const token of tokens) {
    const currentBlock = token.raw;

    // Check if we're inside an HTML block
    if (processHtmlBlock(token, currentBlock)) {
      continue;
    }

    // Check if this is an opening HTML block tag
    handleOpeningHtmlTag(token, currentBlock);

    // Math block merging logic
    if (mergeMathBlocks(currentBlock)) {
      continue;
    }

    mergedBlocks.push(currentBlock);
  }

  return mergedBlocks;
};
