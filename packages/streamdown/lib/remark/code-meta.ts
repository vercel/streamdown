import type { Code, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

/**
 * Remark plugin that forwards code fence meta strings to hast properties.
 * This makes the meta string available as a `metastring` prop to the custom
 * code component, enabling features like custom starting line numbers
 * (e.g. `startLine=10`).
 */
export const remarkCodeMeta: Plugin<[], Root> = () => (tree) => {
  visit(tree, "code", (node: Code) => {
    if (node.meta) {
      node.data = node.data ?? {};
      node.data.hProperties = {
        ...((node.data.hProperties as Record<string, unknown>) ?? {}),
        metastring: node.meta,
      };
    }
  });
};
