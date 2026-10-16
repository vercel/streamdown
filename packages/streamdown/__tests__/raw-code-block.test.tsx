import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const DIAGRAM = "┌──┐\n│hi│\n└──┘";

describe("codeBlockRawLanguages", () => {
  it("renders matching languages verbatim without code block chrome", async () => {
    const { container } = render(
      <Streamdown codeBlockRawLanguages={["ascii"]}>
        {`\`\`\`ascii\n${DIAGRAM}\n\`\`\``}
      </Streamdown>
    );

    await waitFor(() => {
      const raw = container.querySelector('[data-streamdown="raw-code-block"]');
      expect(raw).toBeTruthy();
      expect(raw?.textContent).toContain(DIAGRAM);
      expect(raw?.getAttribute("data-language")).toBe("ascii");
    });
    expect(
      container.querySelector('[data-streamdown="code-block"]')
    ).toBeNull();
  });

  it("disables ligatures and preserves whitespace", async () => {
    const { container } = render(
      <Streamdown codeBlockRawLanguages={["ascii"]}>
        {`\`\`\`ascii\n${DIAGRAM}\n\`\`\``}
      </Streamdown>
    );

    await waitFor(() => {
      const raw = container.querySelector(
        '[data-streamdown="raw-code-block"]'
      ) as HTMLElement | null;
      expect(raw).toBeTruthy();
      expect(raw?.style.whiteSpace).toBe("pre");
      expect(raw?.style.fontVariantLigatures).toBe("none");
    });
  });

  it("does not affect languages that are not listed", async () => {
    const { container } = render(
      <Streamdown codeBlockRawLanguages={["ascii"]}>
        {"```js\nconst a = 1;\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      expect(
        container.querySelector('[data-streamdown="code-block"]')
      ).toBeTruthy();
    });
    expect(
      container.querySelector('[data-streamdown="raw-code-block"]')
    ).toBeNull();
  });

  it("renders nothing special when the option is omitted", async () => {
    const { container } = render(
      <Streamdown>{`\`\`\`ascii\n${DIAGRAM}\n\`\`\``}</Streamdown>
    );

    await waitFor(() => {
      expect(
        container.querySelector('[data-streamdown="code-block"]')
      ).toBeTruthy();
    });
    expect(
      container.querySelector('[data-streamdown="raw-code-block"]')
    ).toBeNull();
  });

  it("lets custom renderers take precedence", async () => {
    const Custom = ({ code }: CustomRendererProps) => (
      <div data-testid="custom">{code}</div>
    );
    const { container } = render(
      <Streamdown
        codeBlockRawLanguages={["ascii"]}
        plugins={{ renderers: [{ language: "ascii", component: Custom }] }}
      >
        {`\`\`\`ascii\n${DIAGRAM}\n\`\`\``}
      </Streamdown>
    );

    await waitFor(() => {
      expect(container.querySelector('[data-testid="custom"]')).toBeTruthy();
    });
    expect(
      container.querySelector('[data-streamdown="raw-code-block"]')
    ).toBeNull();
  });

  it("marks the block incomplete while streaming", async () => {
    const { container } = render(
      <Streamdown codeBlockRawLanguages={["ascii"]} isAnimating>
        {"```ascii\n┌──┐\n│hi"}
      </Streamdown>
    );

    await waitFor(() => {
      const raw = container.querySelector('[data-streamdown="raw-code-block"]');
      expect(raw).toBeTruthy();
      expect(raw?.getAttribute("data-incomplete")).toBe("true");
    });
  });
});
