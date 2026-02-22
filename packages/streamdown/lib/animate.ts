import type { Element, Node, Parent, Root, Text } from "hast";
import type { Pluggable } from "unified";
import { SKIP, visitParents } from "unist-util-visit-parents";

export interface AnimatePlugin {
  name: "animate";
  rehypePlugin: Pluggable;
  /**
   * Set the number of characters from a previous render.
   * Characters up to this count will skip animation (duration=0ms),
   * preventing re-animation of already-visible content during streaming updates.
   * Must be the HAST character count from the previous render (not raw markdown length).
   */
  setPrevContentLength: (length: number) => void;
  /**
   * Reset prevContentLength to 0 (animate everything).
   */
  resetPrevContentLength: () => void;
  /**
   * Returns the total HAST text node character count from the last render.
   * Use this value (not raw markdown length) as the argument to setPrevContentLength
   * on the next render to correctly identify already-visible content.
   */
  getLastRenderCharCount: () => number;
  type: "animate";
}

export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {});
  duration?: number;
  easing?: string;
  sep?: "word" | "char";
}

const WHITESPACE_RE = /\s/;
const WHITESPACE_ONLY_RE = /^\s+$/;
const SKIP_TAGS = new Set(["code", "pre", "svg", "math", "annotation"]);

const isElement = (node: unknown): node is Element =>
  typeof node === "object" &&
  node !== null &&
  "type" in node &&
  (node as Element).type === "element";

const hasSkipAncestor = (ancestors: Node[]): boolean =>
  ancestors.some(
    (ancestor) => isElement(ancestor) && SKIP_TAGS.has(ancestor.tagName)
  );

const splitByWord = (text: string): string[] => {
  const parts: string[] = [];
  let current = "";
  let inWhitespace = false;

  for (const char of text) {
    const isWs = WHITESPACE_RE.test(char);
    if (isWs !== inWhitespace && current) {
      parts.push(current);
      current = "";
    }
    current += char;
    inWhitespace = isWs;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
};

const splitByChar = (text: string): string[] => {
  const parts: string[] = [];
  let wsBuffer = "";

  for (const char of text) {
    if (WHITESPACE_RE.test(char)) {
      wsBuffer += char;
    } else {
      if (wsBuffer) {
        parts.push(wsBuffer);
        wsBuffer = "";
      }
      parts.push(char);
    }
  }

  if (wsBuffer) {
    parts.push(wsBuffer);
  }

  return parts;
};

const makeSpan = (
  word: string,
  animation: string,
  duration: number,
  easing: string,
  skipAnimation?: boolean
): Element => ({
  type: "element",
  tagName: "span",
  properties: {
    "data-sd-animate": true,
    style: skipAnimation
      ? `--sd-animation:sd-${animation};--sd-duration:0ms;--sd-easing:${easing}`
      : `--sd-animation:sd-${animation};--sd-duration:${duration}ms;--sd-easing:${easing}`,
  },
  children: [{ type: "text", value: word }],
});

interface AnimateConfig {
  animation: string;
  duration: number;
  easing: string;
  sep: "word" | "char";
  /** Number of HAST characters from previous render that should not be re-animated */
  prevContentLength?: number;
  /** Total HAST character count from the last completed render */
  lastRenderCharCount: number;
}

const processTextNode = (
  node: Text,
  ancestors: Node[],
  config: AnimateConfig,
  charCounter: { count: number }
): number | typeof SKIP | undefined => {
  const ancestor = ancestors.at(-1);
  /* v8 ignore next */
  if (!(ancestor && "children" in ancestor)) {
    return;
  }

  if (hasSkipAncestor(ancestors)) {
    return SKIP;
  }

  const parent = ancestor as Parent;
  const index = parent.children.indexOf(node);
  /* v8 ignore next */
  if (index === -1) {
    return;
  }

  const text = node.value;
  if (!text.trim()) {
    charCounter.count += text.length;
    return;
  }

  const parts = config.sep === "char" ? splitByChar(text) : splitByWord(text);
  const prevLen = config.prevContentLength ?? 0;

  const nodes: (Element | Text)[] = parts.map((part) => {
    const partStart = charCounter.count;
    charCounter.count += part.length;
    if (WHITESPACE_ONLY_RE.test(part)) {
      return { type: "text", value: part } as Text;
    }
    // Skip animation for content that was already rendered previously
    const skipAnimation = prevLen > 0 && partStart < prevLen;
    return makeSpan(
      part,
      config.animation,
      config.duration,
      config.easing,
      skipAnimation
    );
  });

  parent.children.splice(index, 1, ...nodes);
  return index + nodes.length;
};

export function createAnimatePlugin(options?: AnimateOptions): AnimatePlugin {
  const config: AnimateConfig = {
    animation: options?.animation ?? "fadeIn",
    duration: options?.duration ?? 150,
    easing: options?.easing ?? "ease",
    sep: options?.sep ?? "word",
    lastRenderCharCount: 0,
  };

  const rehypeAnimate = () => (tree: Root) => {
    const charCounter = { count: 0 };
    visitParents(tree, "text", (node: Text, ancestors) =>
      processTextNode(node, ancestors, config, charCounter)
    );
    config.lastRenderCharCount = charCounter.count;
    // Self-reset after each run so sibling blocks don't inherit this block's
    // prevContentLength. With React's depth-first rendering, this executes after
    // the current block's Markdown renders but before the next sibling block's
    // Markdown renders — so each block gets exactly its own prevContentLength.
    config.prevContentLength = 0;
  };

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: rehypeAnimate,
    setPrevContentLength(length: number) {
      config.prevContentLength = length;
    },
    resetPrevContentLength() {
      config.prevContentLength = 0;
    },
    getLastRenderCharCount() {
      return config.lastRenderCharCount;
    },
  };
}

export const animate = createAnimatePlugin();
