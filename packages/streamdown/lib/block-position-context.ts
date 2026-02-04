"use client";

import { createContext, useContext } from "react";

/**
 * Context that indicates whether the current block is incomplete (still being streamed).
 * This is true when: streaming is active AND this is the last block AND it has an unclosed code fence.
 */
const BlockIncompleteContext = createContext(false);

/**
 * Hook to check if the current block is incomplete (still being streamed).
 *
 * Returns `true` when the block containing this component is still being streamed to.
 * Useful for showing loading states in custom components during streaming.
 *
 * @example
 * ```tsx
 * const MyCodeBlock = ({ children }) => {
 *   const isBlockIncomplete = useIsBlockIncomplete();
 *
 *   if (isBlockIncomplete) {
 *     return <div>Loading code...</div>;
 *   }
 *
 *   return <pre><code>{children}</code></pre>;
 * };
 * ```
 */
export const useIsBlockIncomplete = (): boolean =>
  useContext(BlockIncompleteContext);

export { BlockIncompleteContext };
