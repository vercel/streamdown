import { visit } from "unist-util-visit";

interface MdastNode {
  children?: MdastNode[];
  data?: Record<string, unknown>;
  type: string;
  value?: string;
}

/**
 * Post-processor that runs after remark-gfm-admonition.
 * Overrides GitHub-compatible div.markdown-alert output to use
 * Streamdown's custom <admonition> element for React component mapping.
 */
export const remarkAdmonitionStreamdown: () => (tree: MdastNode) => void =
  () => (tree) => {
    visit(tree, (node: MdastNode) => {
      const hProperties = node.data?.hProperties as
        | Record<string, unknown>
        | undefined;
      if (!hProperties) {
        return;
      }

      const classAttr = hProperties.class;
      if (
        typeof classAttr !== "string" ||
        !classAttr.startsWith("markdown-alert markdown-alert-")
      ) {
        return;
      }

      const type = classAttr.replace("markdown-alert markdown-alert-", "");

      node.data = node.data ?? {};
      node.data.hName = "admonition";
      node.data.hProperties = {
        "data-admonition-type": type,
        dataAdmonitionType: type,
      };

      // Remove the injected title paragraph — Streamdown's React component handles titles
      if (node.children) {
        const firstChild = node.children[0];
        const firstChildProps = firstChild?.data?.hProperties as
          | Record<string, unknown>
          | undefined;
        if (firstChildProps?.class === "markdown-alert-title") {
          node.children.splice(0, 1);
        }
      }
    });
  };
