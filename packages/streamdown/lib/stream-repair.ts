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
// past every block but the last two. Only an unchanged repair is used: then
// the blocks are those of the stream itself, while a closer appended at the
// end (such as "$$") could make an open block look finished.
export const advanceStableLength = (
  state: StreamRepairState,
  blocks: string[]
): void => {
  if (state.repaired !== state.input || state.input.includes("\r")) {
    return;
  }
  let next = 0;
  for (let i = 0; i < blocks.length - MUTABLE_BLOCKS; i += 1) {
    next += blocks[i].length;
  }
  if (next > state.stableLength) {
    state.stableLength = next;
  }
};
