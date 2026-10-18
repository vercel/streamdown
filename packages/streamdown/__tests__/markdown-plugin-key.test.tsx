import { render } from "@testing-library/react";
import type { Root } from "hast";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { Markdown } from "../lib/markdown";

// Each call makes a new plugin function with the same name, as two built
// copies of one module's plugin are.
const tagParagraphs = (tag: string) =>
  function rehypeTag() {
    return (tree: Root) => {
      visit(tree, "element", (node) => {
        if (node.tagName === "p") {
          node.properties.dataTag = tag;
        }
      });
    };
  };

describe("processor cache", () => {
  it("builds a processor for each plugin function, however alike their names", () => {
    const first = render(
      <Markdown rehypePlugins={[tagParagraphs("first")]}>text</Markdown>
    );
    const second = render(
      <Markdown rehypePlugins={[tagParagraphs("second")]}>text</Markdown>
    );

    expect(first.container.querySelector("p")?.dataset.tag).toBe("first");
    expect(second.container.querySelector("p")?.dataset.tag).toBe("second");
  });
});
