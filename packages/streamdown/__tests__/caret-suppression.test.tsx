import { render } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const SUPPRESSION_ATTRIBUTE = /:not\(\[([a-z-]+)\]\)/;

const streamdownContainer = (container: HTMLElement) =>
  container.firstElementChild as HTMLElement | null;

// The attribute is read out of the shipped class rather than written here, so a
// rename that reaches only one of the two fails instead of passing vacuously.
const suppressionAttribute = (container: HTMLElement) => {
  const className = streamdownContainer(container)?.className ?? "";
  const match = SUPPRESSION_ATTRIBUTE.exec(className);
  if (!match) {
    throw new Error(
      `no suppression attribute in container class: ${className}`
    );
  }
  return match[1];
};

const isCaretSuppressed = (container: HTMLElement) =>
  streamdownContainer(container)?.lastElementChild?.hasAttribute(
    suppressionAttribute(container)
  ) ?? false;

const caretVariable = (container: HTMLElement) =>
  streamdownContainer(container)?.style.getPropertyValue("--streamdown-caret");

const VegaRenderer = ({ code }: CustomRendererProps) => (
  <div data-testid="vega-renderer">Vega Chart: {code}</div>
);

describe("caret suppression", () => {
  it("suppresses the caret while a code fence is incomplete", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("restores the caret once the code fence completes", () => {
    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(true);

    rerender(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when the last block is a table", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("suppresses the caret while a table is still streaming", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("shows the caret when a table is followed by regular text", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {
          "| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nText after the table"
        }
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("shows the caret after a completed code block", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(false);
  });

  it("suppresses the caret when blocks are wrapped for text direction", () => {
    const { container } = render(
      <Streamdown caret="block" dir="auto" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(true);
  });

  it("clears the mark from a block that is no longer last", () => {
    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    );

    const table = streamdownContainer(container)?.lastElementChild;
    expect(table?.hasAttribute(suppressionAttribute(container))).toBe(true);

    rerender(
      <Streamdown caret="block" isAnimating={true}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nText after."}
      </Streamdown>
    );

    expect(table?.hasAttribute(suppressionAttribute(container))).toBe(false);
  });

  it("does not mark anything when the caret is not animating", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={false}>
        {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
      </Streamdown>
    );

    expect(isCaretSuppressed(container)).toBe(false);
  });

  // Suppression is derived from the block's markdown source, so it holds for
  // markup Streamdown did not render. A rule selecting Streamdown's own
  // data-streamdown markers would miss every case below, because the consumer's
  // component replaces the element carrying the marker.
  describe("with consumer-supplied renderers", () => {
    it("suppresses the caret under a custom fence renderer", () => {
      const { container } = render(
        <Streamdown
          caret="block"
          isAnimating={true}
          plugins={{
            renderers: [{ language: "vega-lite", component: VegaRenderer }],
          }}
        >
          {'```vega-lite\n{"mark": "bar"}'}
        </Streamdown>
      );

      expect(
        container.querySelector('[data-testid="vega-renderer"]')
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced table component", () => {
      const { container } = render(
        <Streamdown
          caret="block"
          components={{
            table: (props) => <table data-testid="plain-table" {...props} />,
          }}
          isAnimating={true}
        >
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>
      );

      expect(
        container.querySelector('[data-testid="plain-table"]')
      ).toBeTruthy();
      expect(isCaretSuppressed(container)).toBe(true);
    });

    it("suppresses the caret under a replaced code component", () => {
      const { container } = render(
        <Streamdown
          caret="block"
          components={{
            code: (props) => <code data-testid="plain-code" {...props} />,
          }}
          isAnimating={true}
        >
          {"```javascript\nconst x = 1;"}
        </Streamdown>
      );

      expect(isCaretSuppressed(container)).toBe(true);
    });
  });

  // Effects do not run on the server, so the attribute cannot be there to
  // suppress anything and the markup has to omit the caret instead. Without
  // this, a document ending in a table ships a caret that only disappears once
  // hydration runs.
  describe("on the server", () => {
    it("omits the caret when the last block is a table", () => {
      const markup = renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"| Name | Age |\n| --- | --- |\n| Alice | 30 |"}
        </Streamdown>
      );

      expect(markup).not.toContain("after:content-[var(--streamdown-caret)]");
    });

    it("omits the caret while a code fence is incomplete", () => {
      const markup = renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"```javascript\nconst x = 1;"}
        </Streamdown>
      );

      expect(markup).not.toContain("after:content-[var(--streamdown-caret)]");
    });

    it("keeps the caret after ordinary prose", () => {
      const markup = renderToStaticMarkup(
        <Streamdown caret="block" isAnimating={true}>
          {"Just some prose."}
        </Streamdown>
      );

      expect(markup).toContain("after:content-[var(--streamdown-caret)]");
    });
  });

  it("keeps the container's className and style constant across block types", () => {
    const chunks = [
      "Some prose to start with.",
      "Some prose to start with.\n\n```javascript\nconst x = 1;",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |",
      "Some prose to start with.\n\n```javascript\nconst x = 1;\n```\n\n| Name | Age |\n| --- | --- |\n| Alice | 30 |\n\nAnd some more prose.",
    ];

    const { container, rerender } = render(
      <Streamdown caret="block" isAnimating={true}>
        {chunks[0]}
      </Streamdown>
    );

    const wrapper = streamdownContainer(container);
    const className = wrapper?.className;
    const style = wrapper?.getAttribute("style");

    expect(className).toBeTruthy();
    expect(caretVariable(container)).toBe('" ▋"');

    for (const chunk of chunks.slice(1)) {
      rerender(
        <Streamdown caret="block" isAnimating={true}>
          {chunk}
        </Streamdown>
      );

      const next = streamdownContainer(container);
      expect(next?.className).toBe(className);
      expect(next?.getAttribute("style")).toBe(style);
    }
  });
});
