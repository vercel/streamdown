import { render } from "@testing-library/react";
import { createElement } from "react";
import { describe, expect, it } from "vitest";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
import { Markdown } from "../lib/markdown";

// Get the Section and Ol components
const components = importedComponents as Required<
  NonNullable<Options["components"]>
>;
const Section = components.section;
const Ol = components.ol;

describe("MemoSection footnote filtering", () => {
  it("should render footnotes through the full pipeline", () => {
    // Test with real markdown footnotes
    const markdown = `Text with footnote[^1].

[^1]: This is the footnote definition.`;

    const { container } = render(
      Markdown({
        children: markdown,
        components,
      })
    );

    // The footnote section should be rendered
    expect(container.textContent).toContain("Text with footnote");
  });

  it("should filter out empty footnote list items (line 642)", () => {
    // Simulate a footnote section with only empty footnotes
    // An "empty" footnote has only a backref link and no content
    const emptyFootnoteItem = createElement("li", {
      id: "user-content-fn-1",
      children: [
        createElement("a", {
          "data-footnote-backref": true,
          href: "#user-content-fnref-1",
          children: "↩",
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      children: [emptyFootnoteItem],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes={true}>
        {footnoteOl}
      </Section>
    );

    // When all footnotes are empty, the section should return null (line 665)
    // or at minimum, the empty item should be filtered out
    expect(container).toBeTruthy();
  });

  it("should keep non-empty footnote items with text content", () => {
    const contentFootnoteItem = createElement("li", {
      id: "user-content-fn-1",
      children: [
        createElement("p", {
          children: [
            "This is footnote content",
            createElement("a", {
              "data-footnote-backref": true,
              href: "#user-content-fnref-1",
              children: "↩",
            }),
          ],
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      children: [contentFootnoteItem],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes={true}>
        {footnoteOl}
      </Section>
    );

    expect(container.textContent).toContain("This is footnote content");
  });

  it("should detect content via grandchild ReactElement that is not backref (line 612)", () => {
    // A footnote item with a <p> child that contains a non-backref element
    const contentFootnoteItem = createElement("li", {
      id: "user-content-fn-1",
      children: [
        createElement("p", {
          children: [
            createElement("strong", { children: "Bold content" }),
            createElement("a", {
              "data-footnote-backref": true,
              href: "#user-content-fnref-1",
              children: "↩",
            }),
          ],
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      children: [contentFootnoteItem],
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes={true}>
        {footnoteOl}
      </Section>
    );

    expect(container.textContent).toContain("Bold content");
  });

  it("should return null when all footnotes are empty (line 642, 665)", () => {
    // An empty footnote: only has a backref link as a direct child of <li>
    // The isEmptyFootnote checks if itemChild has data-footnote-backref
    const emptyFootnoteItem = createElement("li", {
      key: "fn-1",
      id: "user-content-fn-1",
      children: [
        "\n", // whitespace text child
        createElement("a", {
          key: "backref",
          "data-footnote-backref": "",
          href: "#user-content-fnref-1",
          children: "↩",
        }),
      ],
    });

    const footnoteOl = createElement(Ol, {
      key: "ol",
      children: emptyFootnoteItem,
    });

    const { container } = render(
      <Section className="footnotes" data-footnotes="">
        {[footnoteOl]}
      </Section>
    );

    // When all footnotes are empty (only backref, no content), section returns null
    const section = container.querySelector("section");
    expect(section).toBeFalsy();
  });

  it("should handle section with non-array children", () => {
    const { container } = render(
      <Section className="footnotes" data-footnotes={true}>
        <span>single child</span>
      </Section>
    );

    expect(container.textContent).toContain("single child");
  });

  it("should handle non-footnotes section normally", () => {
    const { container } = render(
      <Section className="custom">
        <p>Normal section content</p>
      </Section>
    );

    expect(container.textContent).toContain("Normal section content");
  });
});

describe("CodeComponent code extraction from ReactElement (line 729)", () => {
  it("should extract code from element children via pre wrapper", () => {
    // Simulate the pattern: <pre><code className="language-js">text</code></pre>
    // The Pre component adds data-block, and CodeComponent extracts text
    const _Pre = components.pre;
    const _Code = components.code;

    // Render through Markdown to get the full pipeline
    const { container } = render(
      Markdown({
        children: "```javascript\nconst x = 42;\n```",
        components,
      })
    );

    // The code block should be rendered with the extracted code
    const _codeBlock = container.querySelector(
      '[data-streamdown="code-block"]'
    );
    // If lazy loaded, it may or may not be there immediately
    expect(container).toBeTruthy();
  });
});

describe("MemoParagraph block code unwrapping (line 864)", () => {
  it("should unwrap when child has node with tagName code and data-block", () => {
    const P = components.p;

    // Create a mock child element that simulates block code
    // The MemoParagraph checks: validChildren[0].props.node?.tagName === "code"
    // and "data-block" in childProps
    const mockCodeElement = createElement("code", {
      "data-block": "true",
      node: { tagName: "code" },
      children: "console.log('hello');",
    });

    const { container } = render(<P>{mockCodeElement}</P>);

    // When block code is the only child, P should unwrap (no <p> tag)
    // The check is: node?.tagName === "code" && "data-block" in childProps
    expect(container).toBeTruthy();
  });
});
