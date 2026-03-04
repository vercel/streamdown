import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { CustomRendererProps } from "../lib/plugin-types";

const VegaRenderer = ({
  code,
  language,
  isIncomplete,
}: CustomRendererProps) => (
  <div
    data-code={code}
    data-incomplete={isIncomplete}
    data-language={language}
    data-testid="vega-renderer"
  >
    Vega Chart: {code}
  </div>
);

const D2Renderer = ({ code, language }: CustomRendererProps) => (
  <div data-language={language} data-testid="d2-renderer">
    D2 Diagram: {code}
  </div>
);

describe("Custom Renderers", () => {
  it("renders custom renderer for matching language", async () => {
    const { container } = render(
      <Streamdown
        plugins={{
          renderers: [{ language: "vega-lite", component: VegaRenderer }],
        }}
      >
        {'```vega-lite\n{"mark": "bar"}\n```'}
      </Streamdown>
    );

    await waitFor(() => {
      const renderer = container.querySelector('[data-testid="vega-renderer"]');
      expect(renderer).toBeTruthy();
      expect(renderer?.textContent).toContain('{"mark": "bar"}');
    });
  });

  it("passes correct props to custom renderer", async () => {
    const { container } = render(
      <Streamdown
        plugins={{
          renderers: [{ language: "vega-lite", component: VegaRenderer }],
        }}
      >
        {"```vega-lite\ntest-code\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const renderer = container.querySelector('[data-testid="vega-renderer"]');
      expect(renderer).toBeTruthy();
      expect(renderer?.getAttribute("data-language")).toBe("vega-lite");
      expect(renderer?.getAttribute("data-code")).toBe("test-code\n");
      expect(renderer?.getAttribute("data-incomplete")).toBe("false");
    });
  });

  it("renders non-matching languages as default code blocks", async () => {
    const { container } = render(
      <Streamdown
        plugins={{
          renderers: [{ language: "vega-lite", component: VegaRenderer }],
        }}
      >
        {"```javascript\nconsole.log('hello')\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const renderer = container.querySelector('[data-testid="vega-renderer"]');
      expect(renderer).toBeNull();
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
    });
  });

  it("supports multiple renderers independently", async () => {
    const { container } = render(
      <Streamdown
        plugins={{
          renderers: [
            { language: "vega-lite", component: VegaRenderer },
            { language: "d2", component: D2Renderer },
          ],
        }}
      >
        {"```vega-lite\nchart-code\n```\n\n```d2\ndiagram-code\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const vegaRenderer = container.querySelector(
        '[data-testid="vega-renderer"]'
      );
      const d2Renderer = container.querySelector('[data-testid="d2-renderer"]');
      expect(vegaRenderer).toBeTruthy();
      expect(d2Renderer).toBeTruthy();
      expect(vegaRenderer?.textContent).toContain("chart-code");
      expect(d2Renderer?.textContent).toContain("diagram-code");
    });
  });

  it("supports array language field", async () => {
    const { container } = render(
      <Streamdown
        plugins={{
          renderers: [
            { language: ["vega", "vega-lite"], component: VegaRenderer },
          ],
        }}
      >
        {"```vega\nchart1\n```\n\n```vega-lite\nchart2\n```"}
      </Streamdown>
    );

    await waitFor(() => {
      const renderers = container.querySelectorAll(
        '[data-testid="vega-renderer"]'
      );
      expect(renderers.length).toBe(2);
    });
  });

  it("does not interfere with default code blocks when no renderers configured", async () => {
    const { container } = render(
      <Streamdown>{"```javascript\nconst x = 1;\n```"}</Streamdown>
    );

    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
    });
  });
});
