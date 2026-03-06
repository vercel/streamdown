import { render, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

let codeBlockRenderCount = 0;

vi.mock("../lib/code-block", () => ({
  CodeBlock: ({ code, children }: { code: string; children?: ReactNode }) => {
    codeBlockRenderCount += 1;
    return (
      <div data-testid="mock-code-block">
        <pre>{code}</pre>
        {children}
      </div>
    );
  },
}));

describe("MemoCode in streaming mode", () => {
  it("should not re-render unchanged code blocks on streaming updates", async () => {
    codeBlockRenderCount = 0;

    const initial = "```js\nconst a = 1;\n```\n\nParagraph one";
    const updated = "```js\nconst a = 1;\n```\n\nParagraph one plus";

    const { container, rerender } = render(<Streamdown>{initial}</Streamdown>);

    await waitFor(() => {
      expect(container.textContent).toContain("const a = 1;");
      expect(container.textContent).toContain("Paragraph one");
    });

    const initialRenderCount = codeBlockRenderCount;
    expect(initialRenderCount).toBeGreaterThan(0);

    rerender(<Streamdown>{updated}</Streamdown>);

    await waitFor(() => {
      expect(container.textContent).toContain("Paragraph one plus");
    });

    expect(codeBlockRenderCount).toBe(initialRenderCount);
  });
});
