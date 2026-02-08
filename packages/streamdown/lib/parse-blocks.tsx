import { Lexer } from "marked";

// Regex patterns moved to top level for performance
// Footnote identifiers must be alphanumeric, underscore, or hyphen (e.g., [^1], [^note], [^my-note])
// Previously used [^\]\s] which incorrectly matched regex character classes like [^\s...]
const footnoteReferencePattern = /\[\^[\w-]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
const closingTagPattern = /<\/(\w+)>/;
const openingTagPattern = /<(\w+)[\s>]/;

// HTML void elements (self-closing tags) that don't need closing tags
const voidElements = new Set([
  "area",
  "base",
  "br",
  "col",
  "embed",
  "hr",
  "img",
  "input",
  "link",
  "meta",
  "param",
  "source",
  "track",
  "wbr",
]);

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
  let previousTokenWasCode = false; // Track if previous non-space token was a code block

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
        // Void elements don't need to be pushed to the stack as they don't have closing tags
        if (!(hasClosingTag || voidElements.has(tagName.toLowerCase()))) {
          // This is an opening tag without a closing tag in the same block
          htmlStack.push(tagName);
        }
      }
    }

    // Math block merging logic
    // If previous block has unclosed math (odd number of $$), merge current block into it.
    // This handles cases where marked's Lexer splits math blocks (e.g. = on its own line
    // is interpreted as a setext heading), regardless of whether $$ is at the start of the block.
    // Skip if previous block was a code block (code blocks can contain $$ as shell syntax)
    if (mergedBlocksLen > 0 && !previousTokenWasCode) {
      const previousBlock = mergedBlocks[mergedBlocksLen - 1];
      const prevDollarCount = countDoubleDollars(previousBlock);

      if (prevDollarCount % 2 === 1) {
        mergedBlocks[mergedBlocksLen - 1] = previousBlock + currentBlock;
        continue;
      }
    }

    mergedBlocks.push(currentBlock);

    // Track if this token was a code block (for next iteration)
    // Ignore space tokens when tracking
    if (token.type !== "space") {
      previousTokenWasCode = token.type === "code";
    }
  }

  return mergedBlocks;
};
