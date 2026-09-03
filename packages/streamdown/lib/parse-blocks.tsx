import { Lexer, type Token } from "marked";

// Regex patterns moved to top level for performance
// Footnote identifiers must be alphanumeric, underscore, or hyphen (e.g., [^1], [^note], [^my-note])
// Previously used [^\]\s] which incorrectly matched regex character classes like [^\s...]
const footnoteReferencePattern = /\[\^[\w-]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
// Allow hyphens / colons so custom tags like <ai-thinking> are tracked across
// blank-line interruptions (\w alone only matches [A-Za-z0-9_]).
const openingTagPattern = /<([A-Za-z][\w:-]*)[\s>/]/;

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

// Cache for tag patterns to avoid recreating RegExp objects
const openTagPatternCache = new Map<string, RegExp>();
const closeTagPatternCache = new Map<string, RegExp>();

const getOpenTagPattern = (tagName: string): RegExp => {
  const normalizedTag = tagName.toLowerCase();
  const cached = openTagPatternCache.get(normalizedTag);
  if (cached) {
    return cached;
  }
  const pattern = new RegExp(`<${normalizedTag}(?=[\\s>/])[^>]*>`, "gi");
  openTagPatternCache.set(normalizedTag, pattern);
  return pattern;
};

const getCloseTagPattern = (tagName: string): RegExp => {
  const normalizedTag = tagName.toLowerCase();
  const cached = closeTagPatternCache.get(normalizedTag);
  if (cached) {
    return cached;
  }
  const pattern = new RegExp(`</${normalizedTag}(?=[\\s>])[^>]*>`, "gi");
  closeTagPatternCache.set(normalizedTag, pattern);
  return pattern;
};

// Count non-self-closing open tags in a block
const countNonSelfClosingOpenTags = (
  block: string,
  tagName: string
): number => {
  if (voidElements.has(tagName.toLowerCase())) {
    return 0;
  }
  const matches = block.match(getOpenTagPattern(tagName));
  if (!matches) {
    return 0;
  }
  let count = 0;
  for (const match of matches) {
    // Skip self-closing tags like <div />
    if (!match.trimEnd().endsWith("/>")) {
      count += 1;
    }
  }
  return count;
};

// Count closing tags in a block
const countClosingTags = (block: string, tagName: string): number => {
  const matches = block.match(getCloseTagPattern(tagName));
  return matches ? matches.length : 0;
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

// marked's `Lexer.lex` normalizes line endings before tokenizing. Do the same
// here so that the `raw` text of the block tokens joins back into the input.
const lineEndingPattern = /\r\n|\r/g;

// Only the block-level tokens are needed here: each block is rendered from its
// `raw` text by its own remark pipeline later. `Lexer.lex` would also run the
// inline tokenizer over every block, which is wasted work, so call the block
// tokenizer directly.
const lexBlocks = (markdown: string): Token[] =>
  new Lexer({ gfm: true }).blockTokens(markdown);

// Streaming appends text to the end of the document. Text before the tail can
// still change meaning: a lone "#" is a heading that ends the paragraph above
// it, while "#x" continues that paragraph; "2" after a list is a paragraph,
// while "2." is another item of that list. A block is only final once it ends
// with a blank line and the block after it is complete, that is, followed by
// another block. Blocks before the last such boundary are reused and only the
// rest of the document is lexed again.
//
// A single cached entry covers one document streaming at a time; anything
// else falls back to a full parse. The entry keeps the last document in
// memory for the lifetime of the module.
interface ParseCache {
  blocks: string[];
  input: string;
  // How many leading blocks have been checked to sit at their expected
  // offsets in `input`. marked trims a few raws (a bare "- " lexes to "-\n"),
  // so the offsets used below are checked before they are trusted, but only
  // for blocks that are about to be reused.
  verifiedCount: number;
  verifiedLength: number;
}

let lastParse: ParseCache | null = null;

const blankLineEnding = "\n\n";

// Number of leading blocks that cannot change when text is appended.
const countStableBlocks = (blocks: string[]): number => {
  for (let i = blocks.length - 3; i >= 0; i -= 1) {
    if (blocks[i].endsWith(blankLineEnding)) {
      return i + 1;
    }
  }
  return 0;
};

// A block is a slice of the input it was lexed from, and V8 keeps that whole
// input alive while the slice exists. Copy the blocks lexed from the tail so
// the cache does not hold on to every intermediate document of a stream.
const copyString = (value: string): string => ` ${value}`.slice(1);

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: "Complex parsing logic that handles multiple markdown edge cases"
const mergeTokensIntoBlocks = (tokens: Token[]): string[] => {
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

      // Track nested opening and closing tags of the same type
      // so that inner closing tags don't prematurely close the outer block
      const trackedTag = htmlStack.at(-1) as string;
      const newOpenTags = countNonSelfClosingOpenTags(currentBlock, trackedTag);
      const newCloseTags = countClosingTags(currentBlock, trackedTag);

      for (let i = 0; i < newOpenTags; i += 1) {
        htmlStack.push(trackedTag);
      }
      for (let i = 0; i < newCloseTags; i += 1) {
        if (htmlStack.length > 0 && htmlStack.at(-1) === trackedTag) {
          htmlStack.pop();
        }
      }
      continue;
    }

    // Check if this is an opening HTML block tag
    if (token.type === "html" && token.block) {
      const openingTagMatch = currentBlock.match(openingTagPattern);
      if (openingTagMatch) {
        const tagName = openingTagMatch[1];
        // Count how many tags remain unclosed within this block
        const openTags = countNonSelfClosingOpenTags(currentBlock, tagName);
        const closeTags = countClosingTags(currentBlock, tagName);
        if (openTags > closeTags) {
          // There is at least one unmatched opening tag, keep track of it
          htmlStack.push(tagName);
        }
      }
    }

    // marked v18 no longer absorbs a block token's trailing blank line(s) into
    // its own `raw`; instead that whitespace surfaces as a separate `space`
    // token immediately after (e.g. html/heading/table blocks). A bare space
    // token is never meaningful content on its own, so fold it into the
    // previous block to keep block boundaries/counts identical to v17.
    if (token.type === "space" && mergedBlocksLen > 0) {
      mergedBlocks[mergedBlocksLen - 1] += currentBlock;
      continue;
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

// Reuses the blocks of the previous parse that cannot have changed and lexes
// only the rest of the input. Returns null when nothing can be reused.
const reuseParsedBlocks = (
  previous: ParseCache,
  input: string
): ParseCache | null => {
  if (input.length <= previous.input.length) {
    return null;
  }

  const stableCount = countStableBlocks(previous.blocks);
  if (stableCount === 0 || !input.startsWith(previous.input)) {
    return null;
  }

  let verifiedCount = previous.verifiedCount;
  let verifiedLength = previous.verifiedLength;

  // The tail can shrink the stable region (a setext underline can pull
  // several blocks into one), so never trust more blocks than are stable.
  if (verifiedCount > stableCount) {
    verifiedCount = stableCount;
    verifiedLength = 0;
    for (let i = 0; i < verifiedCount; i += 1) {
      verifiedLength += previous.blocks[i].length;
    }
  }

  while (
    verifiedCount < stableCount &&
    input.startsWith(previous.blocks[verifiedCount], verifiedLength)
  ) {
    verifiedLength += previous.blocks[verifiedCount].length;
    verifiedCount += 1;
  }

  if (verifiedCount !== stableCount) {
    return null;
  }

  const tailBlocks = mergeTokensIntoBlocks(
    lexBlocks(input.slice(verifiedLength))
  ).map(copyString);

  return {
    input,
    blocks: previous.blocks.slice(0, stableCount).concat(tailBlocks),
    verifiedCount,
    verifiedLength,
  };
};

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

  const input = markdown.includes("\r")
    ? markdown.replace(lineEndingPattern, "\n")
    : markdown;
  const reused = lastParse ? reuseParsedBlocks(lastParse, input) : null;
  const { blocks, verifiedCount, verifiedLength } = reused ?? {
    blocks: mergeTokensIntoBlocks(lexBlocks(input)),
    verifiedCount: 0,
    verifiedLength: 0,
  };

  lastParse = { input, blocks, verifiedCount, verifiedLength };

  return blocks;
};
