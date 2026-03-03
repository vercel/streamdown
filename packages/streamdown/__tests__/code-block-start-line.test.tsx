import { render, waitFor } from "@testing-library/react";
import remarkParse from "remark-parse";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { StreamdownContext } from "../index";
import { CodeBlock } from "../lib/code-block";
import { CodeBlockBody } from "../lib/code-block/body";
import { remarkCodeMeta } from "../lib/remark/code-meta";

// ---------------------------------------------------------------------------
// Unit tests for the remarkCodeMeta plugin
// ---------------------------------------------------------------------------

describe("remarkCodeMeta", () => {
  it("exports a function", () => {
    expect(typeof remarkCodeMeta).toBe("function");
  });

  it("attaches metastring to hProperties when meta is present", () => {
    const processor = unified().use(remarkParse).use(remarkCodeMeta);

    const markdown = "```js startLine=10\nconst x = 1;\n```";
    const tree = processor.parse(markdown);
    processor.runSync(tree);

    let foundMeta: string | undefined;
    visit(
      tree,
      "code",
      (node: {
        meta?: string;
        data?: { hProperties?: Record<string, unknown> };
      }) => {
        foundMeta = node.data?.hProperties?.metastring as string | undefined;
      }
    );

    expect(foundMeta).toBe("startLine=10");
  });

  it("does not attach metastring when meta is absent", () => {
    const processor = unified().use(remarkParse).use(remarkCodeMeta);

    const markdown = "```js\nconst x = 1;\n```";
    const tree = processor.parse(markdown);
    processor.runSync(tree);

    let foundMeta: string | undefined;
    visit(
      tree,
      "code",
      (node: {
        meta?: string;
        data?: { hProperties?: Record<string, unknown> };
      }) => {
        foundMeta = node.data?.hProperties?.metastring as string | undefined;
      }
    );

    expect(foundMeta).toBeUndefined();
  });

  it("preserves existing hProperties when adding metastring", () => {
    const processor = unified().use(remarkParse).use(remarkCodeMeta);

    const markdown = "```js startLine=5\nconst y = 2;\n```";
    const tree = processor.parse(markdown);

    // Manually pre-set an existing hProperty to ensure we don't overwrite it
    visit(
      tree,
      "code",
      (node: { data?: { hProperties?: Record<string, unknown> } }) => {
        node.data = node.data ?? {};
        node.data.hProperties = { existing: "value" };
      }
    );

    processor.runSync(tree);

    let props: Record<string, unknown> | undefined;
    visit(
      tree,
      "code",
      (node: { data?: { hProperties?: Record<string, unknown> } }) => {
        props = node.data?.hProperties;
      }
    );

    expect(props?.metastring).toBe("startLine=5");
    expect(props?.existing).toBe("value");
  });
});

// ---------------------------------------------------------------------------
// Unit tests for CodeBlockBody with startLine
// ---------------------------------------------------------------------------

describe("CodeBlockBody with startLine", () => {
  const baseResult = {
    tokens: [[{ content: "const x = 1;" }], [{ content: "const y = 2;" }]],
    bg: "transparent",
    fg: "inherit",
  };

  it("does not set counter-reset inline style when startLine is undefined", () => {
    const { container } = render(
      <CodeBlockBody language="javascript" result={baseResult} />
    );

    const code = container.querySelector("code");
    expect(code).toBeTruthy();
    expect(code?.style.counterReset).toBeFalsy();
  });

  it("does not set counter-reset inline style when startLine is 1", () => {
    const { container } = render(
      <CodeBlockBody language="javascript" result={baseResult} startLine={1} />
    );

    const code = container.querySelector("code");
    expect(code).toBeTruthy();
    expect(code?.style.counterReset).toBeFalsy();
  });

  it("sets counter-reset to N-1 when startLine=10", () => {
    const { container } = render(
      <CodeBlockBody language="javascript" result={baseResult} startLine={10} />
    );

    const code = container.querySelector("code");
    expect(code).toBeTruthy();
    // counter-reset: line 9  (N - 1 so the first displayed number is N)
    expect(code?.style.counterReset).toBe("line 9");
  });

  it("sets counter-reset to N-1 when startLine=100", () => {
    const { container } = render(
      <CodeBlockBody
        language="javascript"
        result={baseResult}
        startLine={100}
      />
    );

    const code = container.querySelector("code");
    expect(code).toBeTruthy();
    expect(code?.style.counterReset).toBe("line 99");
  });
});

// ---------------------------------------------------------------------------
// Integration tests for CodeBlock with startLine
// ---------------------------------------------------------------------------

describe("CodeBlock with startLine", () => {
  const wrapWithContext = (ui: React.ReactNode) => (
    <StreamdownContext.Provider
      value={{
        shikiTheme: ["github-light", "github-dark"],
        controls: true,
        isAnimating: false,
        mode: "streaming" as const,
      }}
    >
      {ui}
    </StreamdownContext.Provider>
  );

  it("renders without startLine using default counter (starts at 1)", async () => {
    const { container } = render(
      wrapWithContext(<CodeBlock code="line one\nline two" language="text" />)
    );

    await waitFor(
      () => {
        const code = container.querySelector("code");
        expect(code).toBeTruthy();
        // No inline counter-reset means lines start from 1 (CSS default)
        expect(code?.style.counterReset).toBeFalsy();
      },
      { timeout: 5000 }
    );
  });

  it("renders with startLine=10 applying counter-reset: line 9", async () => {
    const { container } = render(
      wrapWithContext(
        <CodeBlock code="const x = 1;" language="js" startLine={10} />
      )
    );

    await waitFor(
      () => {
        const code = container.querySelector("code");
        expect(code).toBeTruthy();
        expect(code?.style.counterReset).toBe("line 9");
      },
      { timeout: 5000 }
    );
  });

  it("renders with startLine=1 without any counter-reset override", async () => {
    const { container } = render(
      wrapWithContext(
        <CodeBlock code="const x = 1;" language="js" startLine={1} />
      )
    );

    await waitFor(
      () => {
        const code = container.querySelector("code");
        expect(code).toBeTruthy();
        expect(code?.style.counterReset).toBeFalsy();
      },
      { timeout: 5000 }
    );
  });

  it("renders with startLine=50 applying counter-reset: line 49", async () => {
    const { container } = render(
      wrapWithContext(
        <CodeBlock
          code={"line A\nline B\nline C"}
          language="text"
          startLine={50}
        />
      )
    );

    await waitFor(
      () => {
        const code = container.querySelector("code");
        expect(code).toBeTruthy();
        expect(code?.style.counterReset).toBe("line 49");
      },
      { timeout: 5000 }
    );
  });
});
