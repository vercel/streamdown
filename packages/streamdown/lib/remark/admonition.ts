import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

interface MdastNode {
  children?: MdastNode[];
  data?: Record<string, unknown>;
  type: string;
  value?: string;
}

const ADMONITION_TYPES = new Set([
  "note",
  "tip",
  "important",
  "warning",
  "caution",
]);

const ADMONITION_REGEX = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*\n?/i;

function detectAdmonitionType(node: MdastNode): string | undefined {
  const firstChild = node.children?.[0];
  if (!firstChild || firstChild.type !== "paragraph") {
    return undefined;
  }

  const firstInline = firstChild.children?.[0];
  if (!firstInline || firstInline.type !== "text" || !firstInline.value) {
    return undefined;
  }

  const match = firstInline.value.match(ADMONITION_REGEX);
  if (!match) {
    return undefined;
  }

  const type = match[1].toLowerCase();
  if (!ADMONITION_TYPES.has(type)) {
    return undefined;
  }

  return type;
}

function stripMarker(node: MdastNode): void {
  const paragraph = node.children?.[0];
  const textNode = paragraph?.children?.[0];
  if (!textNode?.value) {
    return;
  }

  const match = textNode.value.match(ADMONITION_REGEX);
  if (!match) {
    return;
  }

  const remaining = textNode.value.slice(match[0].length);

  if (remaining.length > 0) {
    textNode.value = remaining;
  } else if (paragraph?.children && paragraph.children.length > 1) {
    paragraph.children.splice(0, 1);
  } else if (node.children) {
    node.children.splice(0, 1);
  }
}

export const remarkAdmonition: Plugin = () => (tree) => {
  visit(tree, "blockquote", (node: MdastNode) => {
    const type = detectAdmonitionType(node);
    if (!type) {
      return;
    }

    stripMarker(node);

    node.data = node.data ?? {};
    node.data.hName = "admonition";
    node.data.hProperties = {
      ...((node.data.hProperties as Record<string, unknown>) ?? {}),
      "data-admonition-type": type,
      dataAdmonitionType: type,
    };
  });
};
