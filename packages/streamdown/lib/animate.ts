import type { Element, Node, Parent, Root, Text } from "hast";
import type { Pluggable } from "unified";
import { SKIP, visitParents } from "unist-util-visit-parents";

export interface AnimatePlugin {
  /**
   * Returns the total HAST text node character count from the last
   * rehype run, then resets to 0. Use this value as the argument to
   * setPrevContentLength on the next render.
   */
  getLastRenderCharCount: () => number;
  name: "animate";
  rehypePlugin: Pluggable;
  /**
   * Set the number of HAST text characters from a previous render.
   * Characters up to this count will get duration=0ms, preventing
   * re-animation of already-visible content during streaming updates.
   */
  setPrevContentLength: (length: number) => void;
  type: "animate";
}

export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {});
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
  prevContentLength: number;
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
    const delay = skipAnimation ? 0 : charCounter.newIndex++ * config.stagger;
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
  };

  const id = instanceId++;
  const rehypeAnimate = () => (tree: Root) => {
    const charCounter = { count: 0, newIndex: 0 };
    visitParents(tree, "text", (node: Text, ancestors) =>
      processTextNode(node, ancestors, config, renderState, charCounter)
    );
    renderState.lastRenderCharCount = charCounter.count;
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
    getLastRenderCharCount() {
      const count = renderState.lastRenderCharCount;
      renderState.lastRenderCharCount = 0;
      return count;
    },
  };
}

export const animate = createAnimatePlugin();
