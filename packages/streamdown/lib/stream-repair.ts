import remend, { type RemendOptions } from "remend";

// Streaming appends text, and the blocks before the last two cannot change
// once a later block exists. Remend only completes syntax in the last inline
// block, so repairing the text after those blocks gives the same string as
// repairing the whole message, without rescanning the message on every update.
export interface StreamRepairState {
  input: string;
  options: RemendOptions | undefined;
  repaired: string;
  stableLength: number;
}

// Mutable blocks at the end of the document. parseMarkdownIntoBlocks reuses
// the same window for its own cache.
const MUTABLE_BLOCKS = 2;

// Remend tracks math ($, $$, \( and \[) across the whole message, so text
// after a math delimiter can repair differently without the text before it.
// Delimiters inside fenced code are literal, except "$$": remend finds the
// first "$$" in the message to choose how to close an open one.
const mathDelimiterPattern = /\$|\\[([]/;

const backtickRunPattern = /`+/g;
const whitespacePattern = /\s/;

// Whether the block is one CommonMark fence, found by a scan rather than a
// regex, which would backtrack over every shorter opener. The opener is the
// line's whole marker run, as in remend's scanner.
const isWholeFenceBlock = (block: string): boolean => {
  let indent = 0;
  while (block[indent] === " " && indent < 3) {
    indent += 1;
  }
  const marker = block[indent];
  if (marker !== "`" && marker !== "~") {
    return false;
  }
  let open = indent;
  while (block[open] === marker) {
    open += 1;
  }
  // The opener run must be at least 3 markers long to open a fence.
  if (open - indent < 3) {
    return false;
  }

  // The closer is the block's last non-whitespace line, since anything after
  // it must be whitespace for the fence to be the whole block
  let end = block.length;
  while (end > 0 && whitespacePattern.test(block[end - 1])) {
    end -= 1;
  }
  const line = block.lastIndexOf("\n", end - 1) + 1;
  // A closer on the opening line would need a newline before it
  if (line < indent + 3) {
    return false;
  }
  let closer = line;
  while (block[closer] === " " && closer - line < 3) {
    closer += 1;
  }
  let close = closer;
  while (block[close] === marker) {
    close += 1;
  }
  // A fence closes only on a run of the same marker at least as long as the
  // opener, matching remend's scanner (isFenceCloser). A shorter closing run
  // leaves the fence open, spanning into later blocks.
  return close === end && close - closer >= open - indent;
};

const hasMathDelimiter = (block: string): boolean =>
  block.includes("$$") ||
  (mathDelimiterPattern.test(block) && !isWholeFenceBlock(block));

// Remend pairs backtick runs across the whole message, so a run left unpaired
// in one block can open a code span or fence over later text.
const hasUnpairedBacktickRun = (block: string): boolean => {
  if (!block.includes("`") || isWholeFenceBlock(block)) {
    return false;
  }
  const counts = new Map<number, number>();
  for (const [run] of block.matchAll(backtickRunPattern)) {
    counts.set(run.length, (counts.get(run.length) ?? 0) + 1);
  }
  return [...counts.values()].some((count) => count % 2 === 1);
};

export const repairStream = (
  previous: StreamRepairState | null,
  input: string,
  options: RemendOptions | undefined
): StreamRepairState => {
  // parseMarkdownIntoBlocks normalizes CR line endings, which shifts block
  // offsets, so repair those inputs whole.
  const extendsPrevious =
    previous !== null &&
    previous.options === options &&
    !input.includes("\r") &&
    input.length >= previous.input.length &&
    input.startsWith(previous.input);
  const stableLength = extendsPrevious ? previous.stableLength : 0;
  const repaired =
    stableLength > 0
      ? input.slice(0, stableLength) +
        remend(input.slice(stableLength), options)
      : remend(input, options);
  return { input, options, repaired, stableLength };
};

// Called with the blocks parsed from state.repaired. Moves the stable boundary
// past every block but the last two, and stops before the first block with
// math or an unpaired backtick run. Only an unchanged repair is used: then the blocks are those of the
// stream itself, while a closer appended at the end (such as "$$") could make
// an open block look finished. Custom handlers may read the whole message, so
// with them the whole message is always repaired.
export const advanceStableLength = (
  state: StreamRepairState,
  blocks: string[]
): void => {
  if (
    state.repaired !== state.input ||
    state.input.includes("\r") ||
    state.options?.handlers?.length
  ) {
    return;
  }
  let end = 0;
  for (let i = 0; i < blocks.length - MUTABLE_BLOCKS; i += 1) {
    end += blocks[i].length;
    if (end <= state.stableLength) {
      continue;
    }
    if (hasMathDelimiter(blocks[i]) || hasUnpairedBacktickRun(blocks[i])) {
      return;
    }
    state.stableLength = end;
  }
};
