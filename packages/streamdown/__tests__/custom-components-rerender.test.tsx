import { render } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
import { type ExtraProps, Streamdown } from "../index";

type RendererProps = ExtraProps & { children?: ReactNode };

const OldParagraph = ({ children }: RendererProps) => <p>Old {children}</p>;
const OldCode = ({ children }: RendererProps) => <code>Old {children}</code>;
const NewCode = ({ children }: RendererProps) => <code>New {children}</code>;
const NewParagraph = ({ children }: RendererProps) => <p>New {children}</p>;

for (const mode of ["static", "streaming"] as const) {
  describe(`components updates in ${mode} mode`, () => {
    it("replaces renderers in every unchanged block", () => {
      const { container, rerender } = render(
        <Streamdown components={{ p: OldParagraph }} mode={mode}>
          {"balance\n\ntotal"}
        </Streamdown>
      );
      expect(
        Array.from(container.querySelectorAll("p"), (p) => p.textContent)
      ).toEqual(["Old balance", "Old total"]);
      rerender(
        <Streamdown components={{ p: NewParagraph }} mode={mode}>
          {"balance\n\ntotal"}
        </Streamdown>
      );
      expect(
        Array.from(container.querySelectorAll("p"), (p) => p.textContent)
      ).toEqual(["New balance", "New total"]);
    });

    it("adds a renderer without changing Markdown", () => {
      const { container, rerender } = render(
        <Streamdown mode={mode}>balance</Streamdown>
      );
      expect(container.textContent).toBe("balance");
      rerender(
        <Streamdown components={{ p: NewParagraph }} mode={mode}>
          balance
        </Streamdown>
      );
      expect(container.textContent).toBe("New balance");
    });

    it("restores the default renderer when components are removed", () => {
      const { container, rerender } = render(
        <Streamdown components={{ p: OldParagraph }} mode={mode}>
          balance
        </Streamdown>
      );
      expect(container.textContent).toBe("Old balance");
      rerender(<Streamdown mode={mode}>balance</Streamdown>);
      expect(container.textContent).toBe("balance");
    });

    it("handles different keys with the same number of renderers", () => {
      const { container, rerender } = render(
        <Streamdown components={{ p: OldParagraph }} mode={mode}>
          {"# heading\n\nbalance"}
        </Streamdown>
      );
      expect(container.querySelector("h1")?.textContent).toBe("heading");
      expect(container.querySelector("p")?.textContent).toBe("Old balance");
      rerender(
        <Streamdown components={{ h1: NewParagraph }} mode={mode}>
          {"# heading\n\nbalance"}
        </Streamdown>
      );
      expect(
        Array.from(container.querySelectorAll("p"), (p) => p.textContent)
      ).toEqual(["New heading", "balance"]);
    });

    it("updates the inlineCode renderer without changing Markdown", () => {
      const { container, rerender } = render(
        <Streamdown components={{ inlineCode: OldCode }} mode={mode}>
          {"`balance`"}
        </Streamdown>
      );
      expect(container.textContent).toBe("Old balance");
      rerender(
        <Streamdown components={{ inlineCode: NewCode }} mode={mode}>
          {"`balance`"}
        </Streamdown>
      );
      expect(container.textContent).toBe("New balance");
    });

    it("keeps memoization for new maps with the same renderers", () => {
      const Paragraph = vi.fn(NewParagraph);
      const { container, rerender } = render(
        <Streamdown components={{ p: Paragraph }} mode={mode}>
          balance
        </Streamdown>
      );
      expect(container.textContent).toBe("New balance");
      const renderCount = Paragraph.mock.calls.length;
      rerender(
        <Streamdown components={{ p: Paragraph }} mode={mode}>
          balance
        </Streamdown>
      );
      expect(container.textContent).toBe("New balance");
      expect(Paragraph).toHaveBeenCalledTimes(renderCount);
    });
  });
}
