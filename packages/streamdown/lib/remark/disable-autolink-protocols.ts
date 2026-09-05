import type { Link, Root } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Matches the URI scheme at the start of a link's `url` (e.g. "mailto:", "http:").
const PROTOCOL_PATTERN = /^([a-zA-Z][a-zA-Z\d+\-.]*:)/;

/**
 * Normalizes a list of user-supplied protocol names into a lowercase set of
 * `"scheme:"` strings. Accepts protocols with or without a trailing colon
 * (e.g. `"mailto"` and `"mailto:"` are equivalent) and is case-insensitive.
 */
export const normalizeAutolinkProtocols = (protocols: string[]): Set<string> =>
  new Set(
    protocols
      .map((protocol) => protocol.trim().toLowerCase())
      .filter((protocol) => protocol.length > 0)
      .map((protocol) => (protocol.endsWith(":") ? protocol : `${protocol}:`))
  );

/**
 * Determines whether a `link` node is a GFM autolink-literal (created by
 * `remark-gfm`'s autolink-literal extension for bare URLs/emails) whose
 * protocol is in the disabled set.
 *
 * `mdast-util-gfm-autolink-literal` does not tag the nodes it creates, so
 * autolinks are identified structurally: they have exactly one `text` child
 * whose visible value reconstructs the node's `url`. Bare emails become
 * `{ url: "mailto:<email>", children: [{ type: "text", value: "<email>" }] }`;
 * bare http(s)/www URLs become a link whose single text child equals the URL
 * (optionally without the `http://` prefix that GFM adds for `www.` links).
 *
 * Explicit markdown links (`[text](url)`) are intentionally left untouched
 * unless their visible text happens to exactly reconstruct the URL, in which
 * case they are indistinguishable from an autolink at the mdast level.
 */
function isDisabledAutolink(
  node: Link,
  disabledProtocols: Set<string>
): boolean {
  if (node.children.length !== 1) {
    return false;
  }

  const [child] = node.children;
  if (child.type !== "text") {
    return false;
  }

  const protocolMatch = PROTOCOL_PATTERN.exec(node.url);
  if (!protocolMatch) {
    return false;
  }

  const protocol = protocolMatch[1].toLowerCase();
  if (!disabledProtocols.has(protocol)) {
    return false;
  }

  if (protocol === "mailto:") {
    return node.url === `mailto:${child.value}`;
  }

  return node.url === child.value || node.url === `${protocol}//${child.value}`;
}

/**
 * Remark plugin that removes GFM autolink-literal links whose protocol
 * matches one of the configured `protocols`, unwrapping them back to plain
 * text. Must run AFTER `remark-gfm` in the plugin pipeline so the autolink
 * nodes exist for it to inspect.
 *
 * Uses the standard unified `[plugin, options]` tuple form (rather than a
 * plugin factory) so Streamdown's internal processor cache — which keys
 * processors by plugin name plus `JSON.stringify(options)` — can tell
 * different `protocols` configurations apart. A factory returning a fresh
 * closure per call would always serialize to the same anonymous-function
 * key and silently reuse a stale cached processor.
 *
 * A no-op (no protocols configured) skips the tree traversal entirely.
 */
export const remarkDisableAutolinkProtocols: Plugin<[string[]?], Root> = (
  protocols = []
) => {
  const disabledProtocols = normalizeAutolinkProtocols(protocols);

  return (tree: Root) => {
    if (disabledProtocols.size === 0) {
      return;
    }

    visit(tree, "link", (node, index, parent) => {
      if (!parent || index === undefined) {
        return;
      }
      if (!isDisabledAutolink(node, disabledProtocols)) {
        return;
      }
      parent.children.splice(index, 1, ...node.children);
      return index;
    });
  };
};
