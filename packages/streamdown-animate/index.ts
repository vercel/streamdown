import type { Element, Node, Root, Text } from "hast";
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
    const isWs = /\s/.test(char);
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
    if (/\s/.test(char)) {
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

export function createAnimatePlugin(options?: AnimateOptions): AnimatePlugin {
  const animation = options?.animation ?? "fadeIn";
  const duration = options?.duration ?? 150;
  const easing = options?.easing ?? "ease";
  const sep = options?.sep ?? "word";

  const rehypeAnimate = () => (tree: Root) => {
    visitParents(tree, "text", (node: Text, ancestors) => {
      const parent = ancestors[ancestors.length - 1];
      if (!parent || !("children" in parent)) {
        return;
      }

      // Skip text inside code, pre, svg, math, annotation
      if (hasSkipAncestor(ancestors)) {
        return SKIP;
      }

      const index = parent.children.indexOf(node);
      if (index === -1) {
        return;
      }

      const text = node.value;
      if (!text.trim()) {
        return;
      }

      const parts = sep === "char" ? splitByChar(text) : splitByWord(text);

      const nodes: (Element | Text)[] = parts.map((part) => {
        if (/^\s+$/.test(part)) {
          return { type: "text", value: part } as Text;
        }
        return makeSpan(part, animation, duration, easing);
      });

      parent.children.splice(index, 1, ...nodes);
      return index + nodes.length;
    });
  };

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: rehypeAnimate,
  };
}

export const animate = createAnimatePlugin();
