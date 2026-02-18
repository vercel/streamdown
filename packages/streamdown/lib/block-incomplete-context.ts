"use client";

import { createContext, useContext } from "react";

/**
 * Context that indicates whether the current block has an incomplete code fence.
 * True when: streaming is active AND this is the last block AND it has an unclosed code fence.
 */
const BlockIncompleteContext = createContext(false);

/**
 * Hook to check if the current block has an incomplete (unclosed) code fence.
 *
 * Returns `true` when the code fence in this block is still being streamed.
 * Useful for deferring expensive renders (syntax highlighting, Mermaid diagrams)
 * until the code block is complete.
 */
export const useIsCodeFenceIncomplete = (): boolean =>
  useContext(BlockIncompleteContext);

export { BlockIncompleteContext };
