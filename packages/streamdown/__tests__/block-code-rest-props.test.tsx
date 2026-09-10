/**
 * The `code` component forwards its rest props on the inline branch and not on
 * the block branch, so an attribute a consumer puts on a fenced code element —
 * via a rehype plugin, the supported way to annotate rendered output — reaches
 * inline code and silently disappears on code blocks.
 *
 * Once it is forwarded, CodeBlockBody has to compare it too, or the first value
 * it renders with is the only one it ever renders.
 */

import { render, waitFor } from "@testing-library/react";
import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

/** Stamps every `code` element with the source offset it was parsed from. */
const stampSourceOffset = () => (tree: Root) => {
  visit(tree, "element", (node) => {
    if (node.tagName !== "code") {
      return;
    }
    const start = node.position?.start?.offset;
    node.properties = {
      ...node.properties,
      "data-src-start": start === undefined ? "unknown" : String(start),
    };
  });
};

const findStamped = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("[data-src-start]"));

describe("rest props on block code", () => {
  it("forwards a consumer attribute to a fenced code block", async () => {
    const markdown = "Some `inline` code.\n\n```ts\nconst x = 1;\n```";

    const { container } = render(
      <Streamdown mode="static" rehypePlugins={[stampSourceOffset]}>
        {markdown}
      </Streamdown>
    );

    await waitFor(() =>
      expect(container.textContent).toContain("const x = 1;")
    );

    // Both code elements — the inline one and the fenced one — carry the stamp.
    expect(findStamped(container)).toHaveLength(2);
  });

  it("lands the attribute on the element holding the code text", async () => {
    const markdown = "```ts\nconst x = 1;\n```";

    const { container } = render(
      <Streamdown mode="static" rehypePlugins={[stampSourceOffset]}>
        {markdown}
      </Streamdown>
    );

    await waitFor(() =>
      expect(container.textContent).toContain("const x = 1;")
    );

    const stamped = findStamped(container);
    expect(stamped).toHaveLength(1);
    // The header label and the copy/download controls are siblings of the body,
    // so a stamp that landed correctly describes exactly the code text.
    expect(stamped[0].textContent).toContain("const x = 1;");
    expect(stamped[0].textContent).not.toContain("ts\nconst");
  });

  it("updates the attribute when the code block moves", async () => {
    // A paragraph inserted above pushes the fence down the document. The code
    // itself is untouched, so the highlighted tokens keep their identity and
    // only the forwarded attribute differs — which is the case a comparator
    // that ignores forwarded props gets wrong.
    const before = "Intro\n\n```ts\nconst x = 1;\n```";
    const after = "Intro\n\nMore text\n\n```ts\nconst x = 1;\n```";

    const { container, rerender } = render(
      <Streamdown mode="static" rehypePlugins={[stampSourceOffset]}>
        {before}
      </Streamdown>
    );
    await waitFor(() =>
      expect(container.textContent).toContain("const x = 1;")
    );

    const initial = Number(
      findStamped(container)[0]?.getAttribute("data-src-start")
    );
    expect(Number.isNaN(initial)).toBe(false);

    rerender(
      <Streamdown mode="static" rehypePlugins={[stampSourceOffset]}>
        {after}
      </Streamdown>
    );

    await waitFor(() => {
      const updated = Number(
        findStamped(container)[0]?.getAttribute("data-src-start")
      );
      expect(updated).toBe(initial + (after.length - before.length));
    });
  });

  it("does not leak the internal data-block marker into the DOM", async () => {
    const { container } = render(
      <Streamdown mode="static">{"```ts\nconst x = 1;\n```"}</Streamdown>
    );

    await waitFor(() =>
      expect(container.textContent).toContain("const x = 1;")
    );
    expect(container.querySelectorAll("[data-block]")).toHaveLength(0);
  });
});
