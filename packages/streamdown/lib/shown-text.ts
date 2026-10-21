import type { Element, Node, Root } from "hast";
import { SKIP, visitParents } from "unist-util-visit-parents";
import type { AnimatePlugin } from "./animate";

// Skip layout-sensitive subtrees. Fenced/highlighted blocks are protected via
// `pre` (CommonMark always emits `pre > code`); raw inline `code` is safe to
// animate — word spans inherit styles the same way surrounding prose does (#594).
export const SKIP_TAGS = new Set(["pre", "svg", "math", "annotation"]);
// Elements with no text node of their own that should still animate in. They
// honor opacity/filter/transform, so they reuse the standard [data-sd-animate]
// rule and work with every animation type.
export const VOID_ANIMATE_TAGS = new Set(["img", "hr"]);

const isElement = (node: Node): node is Element => node.type === "element";

export interface ShownTextPlugin extends AnimatePlugin {
  committedCharCount: () => number;
}

/**
 * A block's plugin while the word fade loads: it counts the text the block
 * shows the way the fade does, so the fade the block gets on arrival starts
 * after that text, as if it had run from the first render.
 */
export const createShownTextPlugin = (): ShownTextPlugin => {
  let counted = 0;
  let committed = 0;
  const countShownText = () => (tree: Root) => {
    counted = 0;
    visitParents(
      tree,
      (node) =>
        node.type === "text" ||
        (isElement(node) && VOID_ANIMATE_TAGS.has(node.tagName)),
      (node, ancestors) => {
        if (
          ancestors.some(
            (ancestor) =>
              ancestor.type === "element" && SKIP_TAGS.has(ancestor.tagName)
          )
        ) {
          return SKIP;
        }
        counted += node.type === "text" ? node.value.length : 1;
      }
    );
  };

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: countShownText,
    commit() {
      committed = counted;
    },
    committedCharCount: () => committed,
    getLastRenderCharCount: () => counted,
    setPrevContentLength(length: number) {
      committed = length;
    },
  };
};
