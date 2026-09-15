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
 * Determines whether a `link` node is an autolink (GFM autolink-literal or
 * CommonMark `<...>`) whose protocol is in the disabled set.
 *
 * GFM / CommonMark autolinks and explicit markdown links can be mdast-
 * identical when the label reconstructs the URL (e.g. bare `foo@x.com` vs
 * `[foo@x.com](mailto:foo@x.com)`). When position info is present we reject
 * any node whose source opens with `[` — that is always an intentional
 * resource link. Autolinks are then identified structurally: a single `text`
 * child whose value reconstructs `url` (accounting for the `mailto:` /
 * `http://` prefixes GFM adds).
 */
function isDisabledAutolink(
  node: Link,
  disabledProtocols: Set<string>,
  source: string
): boolean {
  // Explicit `[label](url)` resource links always open with `[` in source.
  const start = node.position?.start?.offset;
  if (typeof start === "number" && source.charCodeAt(start) === 91 /* [ */) {
    return false;
  }

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

  // Bare `https://...` (text === url) or `www....` (url === `http://` + text).
  return node.url === child.value || node.url === `${protocol}//${child.value}`;
}

/**
 * Remark plugin that removes GFM / CommonMark autolinks whose protocol
 * matches one of the configured `protocols`, unwrapping them back to plain
 * text. Must run AFTER `remark-gfm` in the plugin pipeline so GFM autolink
 * nodes exist for it to inspect.
 *
 * Explicit markdown links (`[text](url)`) are left alone, including cases
 * where the label text reconstructs the URL — those are distinguished via
 * source positions (`[` opener) rather than mdast shape alone.
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

  return (tree: Root, file: { value?: unknown }) => {
    if (disabledProtocols.size === 0) {
      return;
    }

    const source = String(file.value ?? "");

    visit(tree, "link", (node, index, parent) => {
      if (!parent || index === undefined) {
        return;
      }
      if (!isDisabledAutolink(node, disabledProtocols, source)) {
        return;
      }
      parent.children.splice(index, 1, ...node.children);
      return index;
    });
  };
};
