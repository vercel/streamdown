import type { Element, Node, Parent, Root, Text } from "hast";
import type { Pluggable } from "unified";
import { SKIP, visitParents } from "unist-util-visit-parents";

export interface AnimatePlugin {
  name: "animate";
  type: "animate";
  rehypePlugin: Pluggable;
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
  easing: string
): Element => ({
  type: "element",
  tagName: "span",
  properties: {
    "data-sd-animate": true,
    style: `--sd-animation:sd-${animation};--sd-duration:${duration}ms;--sd-easing:${easing}`,
  },
  children: [{ type: "text", value: word }],
});

interface AnimateConfig {
  animation: string;
  duration: number;
  easing: string;
  sep: "word" | "char";
}

const processTextNode = (
  node: Text,
  ancestors: Node[],
  config: AnimateConfig
): number | typeof SKIP | undefined => {
  const ancestor = ancestors.at(-1);
  if (!(ancestor && "children" in ancestor)) {
    return;
  }

  if (hasSkipAncestor(ancestors)) {
    return SKIP;
  }

  const parent = ancestor as Parent;
  const index = parent.children.indexOf(node);
  if (index === -1) {
    return;
  }

  const text = node.value;
  if (!text.trim()) {
    return;
  }

  const parts = config.sep === "char" ? splitByChar(text) : splitByWord(text);

  const nodes: (Element | Text)[] = parts.map((part) =>
    WHITESPACE_ONLY_RE.test(part)
      ? ({ type: "text", value: part } as Text)
      : makeSpan(part, config.animation, config.duration, config.easing)
  );

  parent.children.splice(index, 1, ...nodes);
  return index + nodes.length;
};

export function createAnimatePlugin(options?: AnimateOptions): AnimatePlugin {
  const config: AnimateConfig = {
    animation: options?.animation ?? "fadeIn",
    duration: options?.duration ?? 150,
    easing: options?.easing ?? "ease",
    sep: options?.sep ?? "word",
  };

  const rehypeAnimate = () => (tree: Root) => {
    visitParents(tree, "text", (node: Text, ancestors) =>
      processTextNode(node, ancestors, config)
    );
  };

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: rehypeAnimate,
  };
}

export const animate = createAnimatePlugin();
