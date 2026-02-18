import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

describe("controls prop", () => {
  const markdownWithTable = `
| Column 1 | Column 2 |
|----------|----------|
| Data 1   | Data 2   |
`;

  const markdownWithCode = `
\`\`\`javascript
console.log('Hello World');
\`\`\`
`;

  const markdownWithMermaid = `
\`\`\`mermaid
graph TD
    A[Start] --> B[End]
\`\`\`
`;

  describe("boolean configuration", () => {
    it("should show all controls by default", () => {
      const { container } = render(
        <Streamdown>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should show all controls when controls is true", () => {
      const { container } = render(
        <Streamdown controls={true}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should hide all controls when controls is false", () => {
      const { container } = render(
        <Streamdown controls={false}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should hide code block controls when controls is false", () => {
      const { container } = render(
        <Streamdown controls={false}>{markdownWithCode}</Streamdown>
      );

      const buttons = container.querySelectorAll(
        '[data-streamdown="code-block-actions"] button'
      );

      expect(buttons?.length).toBe(0);
    });
  });

  describe("object configuration", () => {
    it("should hide only table controls when table is false", () => {
      const { container } = render(
        <Streamdown controls={{ table: false }}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should show table controls when table is true", () => {
      const { container } = render(
        <Streamdown controls={{ table: true }}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should hide only code controls when code is false", () => {
      const { container } = render(
        <Streamdown controls={{ code: false }}>{markdownWithCode}</Streamdown>
      );

      const buttons = container.querySelectorAll(
        '[data-streamdown="code-block-actions"] button'
      );

      expect(buttons?.length).toBe(0);
    });

    it("should show code controls when code is true", async () => {
      const { container } = render(
        <Streamdown controls={{ code: true }}>{markdownWithCode}</Streamdown>
      );

      await waitFor(() => {
        const buttons = container.querySelectorAll(
          '[data-streamdown="code-block-actions"] button'
        );
        expect(buttons?.length).toBeGreaterThan(0);
      });
    });

    it("should hide only mermaid controls when mermaid is false", async () => {
      const mockMermaidPlugin = {
        name: "mermaid" as const,
        type: "diagram" as const,
        language: "mermaid",
        getMermaid: () => ({
          initialize: vi.fn(),
          render: vi.fn().mockResolvedValue({ svg: "<svg>Test</svg>" }),
        }),
      };

      const { container } = render(
        <Streamdown
          controls={{ mermaid: false }}
          plugins={{ mermaid: mockMermaidPlugin }}
        >
          {markdownWithMermaid}
        </Streamdown>
      );

      // Wait for Suspense boundary to resolve
      await waitFor(() => {
        const mermaidBlock = container.querySelector(
          '[data-streamdown="mermaid-block"]'
        );
        expect(mermaidBlock).toBeTruthy();
      });

      const mermaidBlock = container.querySelector(
        '[data-streamdown="mermaid-block"]'
      );
      const buttons = mermaidBlock?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should allow mixed configuration", async () => {
      const combined = `
${markdownWithTable}
${markdownWithCode}
      `;

      const { container } = render(
        <Streamdown controls={{ table: false, code: true }}>
          {combined}
        </Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const tableButtons = tableWrapper?.querySelectorAll("button");
      expect(tableButtons?.length).toBe(0);

      await waitFor(() => {
        const codeButtons = container.querySelectorAll(
          '[data-streamdown="code-block-actions"] button'
        );
        expect(codeButtons?.length).toBeGreaterThan(0);
      });
    });

    it("should default unspecified controls to true", async () => {
      const combined = `
${markdownWithTable}
${markdownWithCode}
      `;

      const { container } = render(
        <Streamdown controls={{ table: false }}>{combined}</Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const tableButtons = tableWrapper?.querySelectorAll("button");
      expect(tableButtons?.length).toBe(0);

      // Code controls should still show since not specified
      await waitFor(() => {
        const codeButtons = container.querySelectorAll(
          '[data-streamdown="code-block-actions"] button'
        );
        expect(codeButtons?.length).toBeGreaterThan(0);
      });
    });

    it("should hide mermaid pan-zoom controls when panZoom is false", async () => {
      const mockMermaidPlugin = {
        name: "mermaid" as const,
        type: "diagram" as const,
        language: "mermaid",
        getMermaid: () => ({
          initialize: vi.fn(),
          render: vi.fn().mockResolvedValue({ svg: "<svg>Test</svg>" }),
        }),
      };

      const mermaidWithControls = `
\`\`\`mermaid
graph TD
    A-->B
\`\`\`
`;

      const { container } = render(
        <Streamdown
          controls={{ mermaid: { panZoom: false } }}
          plugins={{ mermaid: mockMermaidPlugin }}
        >
          {mermaidWithControls}
        </Streamdown>
      );

      await waitFor(() => {
        const zoomInButton = container.querySelector('button[title="Zoom in"]');
        expect(zoomInButton).toBeFalsy();
      });
    });

    it("should show mermaid pan-zoom controls by default", async () => {
      const mockMermaidPlugin = {
        name: "mermaid" as const,
        type: "diagram" as const,
        language: "mermaid",
        getMermaid: () => ({
          initialize: vi.fn(),
          render: vi.fn().mockResolvedValue({ svg: "<svg>Test</svg>" }),
        }),
      };

      const mermaidContent = `
\`\`\`mermaid
graph TD
    A-->B
\`\`\`
`;

      const { container } = render(
        <Streamdown
          controls={{ mermaid: {} }}
          plugins={{ mermaid: mockMermaidPlugin }}
        >
          {mermaidContent}
        </Streamdown>
      );

      await waitFor(() => {
        const zoomInButton = container.querySelector('button[title="Zoom in"]');
        expect(zoomInButton).toBeTruthy();
      });
    });
  });

  describe("with custom components", () => {
    it("should respect controls with custom component overrides", () => {
      const CustomParagraph = ({ children }: any) => (
        <p className="custom-paragraph">{children}</p>
      );

      const { container } = render(
        <Streamdown components={{ p: CustomParagraph }} controls={false}>
          {markdownWithTable}
        </Streamdown>
      );

      const tableWrapper = container.querySelector(
        '[data-streamdown="table-wrapper"]'
      );
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });
  });
});
