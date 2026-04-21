import type { Element, Node, Parent, Root, Text } from "hast";
import type { Pluggable } from "unified";
import { SKIP, visitParents } from "unist-util-visit-parents";

/**
 * Shared cursor used to chain stagger delays across sibling blocks in a
 * single render pass.  Create one instance per Streamdown component and
 * reset `cursor.current = 0` before each React render so that block 0
 * starts at index 0 and each subsequent block continues from where the
 * previous one left off.
 */
export interface AnimateCursor {
  current: number;
}

export function createAnimateCursor(): AnimateCursor {
  return { current: 0 };
}

export interface AnimatePlugin {
  /**
   * Returns the total HAST text node character count from the last
   * rehype run, then resets to 0. Use this value as the argument to
   * setPrevContentLength on the next render.
   */
  getLastRenderCharCount: () => number;
  /**
   * Returns the number of newly-animated words from the last rehype run,
   * then resets to 0. Pass this value to setStartIndex() on the next
   * sibling block so its stagger delays chain after ours.
   */
  getLastRenderNewWordCount: () => number;
  name: "animate";
  rehypePlugin: Pluggable;
  /**
   * Set the number of HAST text characters from a previous render.
   * Characters up to this count will get duration=0ms, preventing
   * re-animation of already-visible content during streaming updates.
   */
  setPrevContentLength: (length: number) => void;
  /**
   * Set the animation word index to start from. Used when no shared
   * cursor is provided. Use the value returned by
   * getLastRenderNewWordCount() from the previous sibling block to
   * ensure that a new block's stagger delays begin after the previous
   * block's animation is still completing, preventing concurrent reveals.
   */
  setStartIndex: (index: number) => void;
  type: "animate";
}

export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {});
  /**
   * Shared cursor for automatic cross-block stagger chaining.  When
   * provided the plugin reads `cursor.current` as the start index and
   * increments it by the number of newly animated words after each run,
   * so sibling blocks automatically pick up where the previous one left
   * off without any manual `setStartIndex` calls.
   */
  cursor?: AnimateCursor;
  duration?: number;
  easing?: string;
  sep?: "word" | "char";
  stagger?: number;
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
  skipAnimation?: boolean,
  delay?: number
): Element => {
  let style = `--sd-animation:sd-${animation};--sd-duration:${skipAnimation ? 0 : duration}ms;--sd-easing:${easing}`;
  if (delay) {
    style += `;--sd-delay:${delay}ms`;
  }
  return {
    type: "element",
    tagName: "span",
    properties: {
      "data-sd-animate": true,
      style,
    },
    children: [{ type: "text", value: word }],
  };
};

interface AnimateConfig {
  animation: string;
  cursor?: AnimateCursor;
  duration: number;
  easing: string;
  sep: "word" | "char";
  stagger: number;
}

/**
 * Mutable render state shared between the plugin API and the rehype
 * closure. Stored separately from AnimateConfig so that the processor
 * cache (which retains the first closure) always reads from the same
 * object that setPrevContentLength / getLastRenderCharCount mutate.
 */
interface AnimateRenderState {
  lastRenderCharCount: number;
  lastRenderNewWordCount: number;
  prevContentLength: number;
  startIndex: number;
}

const processTextNode = (
  node: Text,
  ancestors: Node[],
  config: AnimateConfig,
  renderState: AnimateRenderState,
  charCounter: { count: number; newIndex: number }
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
  const prevLen = renderState.prevContentLength;

  const nodes: (Element | Text)[] = parts.map((part) => {
    const partStart = charCounter.count;
    charCounter.count += part.length;
    if (WHITESPACE_ONLY_RE.test(part)) {
      return { type: "text", value: part } as Text;
    }
    const skipAnimation = prevLen > 0 && partStart < prevLen;
    const delay = skipAnimation
      ? 0
      : (renderState.startIndex + charCounter.newIndex++) * config.stagger;
    return makeSpan(
      part,
      config.animation,
      config.duration,
      config.easing,
      skipAnimation,
      delay
    );
  });

  parent.children.splice(index, 1, ...nodes);
  return index + nodes.length;
};

// Instance counter ensures each plugin gets a unique rehype function name.
// The processor cache in markdown.ts keys by function name, so without unique
// names, different AnimatePlugin instances would share a cached processor
// whose closure reads a stale config.
let instanceId = 0;

export function createAnimatePlugin(options?: AnimateOptions): AnimatePlugin {
  const config: AnimateConfig = {
    animation: options?.animation ?? "fadeIn",
    cursor: options?.cursor,
    duration: options?.duration ?? 150,
    easing: options?.easing ?? "ease",
    sep: options?.sep ?? "word",
    stagger: options?.stagger ?? 40,
  };

  // Mutable render state — the rehype closure and the plugin API methods
  // both reference this same object.
  const renderState: AnimateRenderState = {
    prevContentLength: 0,
    lastRenderCharCount: 0,
    lastRenderNewWordCount: 0,
    startIndex: 0,
  };

  const id = instanceId++;
  const rehypeAnimate = () => (tree: Root) => {
    const charCounter = { count: 0, newIndex: 0 };
    // When a shared cursor is provided, read the current cumulative word
    // index from it so this block's stagger delays continue after all
    // preceding sibling blocks.
    if (config.cursor) {
      renderState.startIndex = config.cursor.current;
    }
    visitParents(tree, "text", (node: Text, ancestors) =>
      processTextNode(node, ancestors, config, renderState, charCounter)
    );
    renderState.lastRenderCharCount = charCounter.count;
    renderState.lastRenderNewWordCount = charCounter.newIndex;
    // Advance the shared cursor so the next sibling block starts after us.
    if (config.cursor) {
      config.cursor.current += charCounter.newIndex;
    }
    // Self-reset so sibling blocks don't inherit this block's value.
    // React renders depth-first: this runs after the current block's
    // Markdown but before the next sibling block's Markdown.
    renderState.prevContentLength = 0;
  };

  // Give each instance a unique function name so the processor cache
  // in markdown.ts creates a separate processor per plugin instance.
  Object.defineProperty(rehypeAnimate, "name", {
    value: `rehypeAnimate$${id}`,
  });

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: rehypeAnimate,
    setPrevContentLength(length: number) {
      renderState.prevContentLength = length;
    },
    setStartIndex(index: number) {
      renderState.startIndex = index;
    },
    getLastRenderCharCount() {
      const count = renderState.lastRenderCharCount;
      renderState.lastRenderCharCount = 0;
      return count;
    },
    getLastRenderNewWordCount() {
      const count = renderState.lastRenderNewWordCount;
      renderState.lastRenderNewWordCount = 0;
      return count;
    },
  };
}

export const animate = createAnimatePlugin();
