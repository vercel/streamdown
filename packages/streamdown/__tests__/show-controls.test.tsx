import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("showControls prop", () => {
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
      const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should show all controls when showControls is true", () => {
      const { container } = render(
        <Streamdown showControls={true}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should hide all controls when showControls is false", () => {
      const { container } = render(
        <Streamdown showControls={false}>{markdownWithTable}</Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should hide code block controls when showControls is false", () => {
      const { container } = render(
        <Streamdown showControls={false}>{markdownWithCode}</Streamdown>
      );

      const buttons = container.querySelectorAll('[data-code-block-header] button');

      expect(buttons?.length).toBe(0);
    });
  });

  describe("object configuration", () => {
    it("should hide only table controls when table is false", () => {
      const { container } = render(
        <Streamdown showControls={{ table: false }}>
          {markdownWithTable}
        </Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should show table controls when table is true", () => {
      const { container } = render(
        <Streamdown showControls={{ table: true }}>
          {markdownWithTable}
        </Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should hide only code controls when code is false", () => {
      const { container } = render(
        <Streamdown showControls={{ code: false }}>
          {markdownWithCode}
        </Streamdown>
      );

      const buttons = container.querySelectorAll('[data-code-block-header] button');

      expect(buttons?.length).toBe(0);
    });

    it("should show code controls when code is true", () => {
      const { container } = render(
        <Streamdown showControls={{ code: true }}>
          {markdownWithCode}
        </Streamdown>
      );

      const buttons = container.querySelectorAll('[data-code-block-header] button');

      expect(buttons?.length).toBeGreaterThan(0);
    });

    it("should hide only mermaid controls when mermaid is false", () => {
      const { container } = render(
        <Streamdown showControls={{ mermaid: false }}>
          {markdownWithMermaid}
        </Streamdown>
      );

      const mermaidBlock = container.querySelector('[data-streamdown="mermaid-block"]');
      const buttons = mermaidBlock?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });

    it("should allow mixed configuration", () => {
      const combined = `
${markdownWithTable}
${markdownWithCode}
      `;

      const { container } = render(
        <Streamdown showControls={{ table: false, code: true }}>
          {combined}
        </Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const tableButtons = tableWrapper?.querySelectorAll("button");
      expect(tableButtons?.length).toBe(0);

      const codeButtons = container.querySelectorAll('[data-code-block-header] button');
      expect(codeButtons?.length).toBeGreaterThan(0);
    });

    it("should default unspecified controls to true", () => {
      const combined = `
${markdownWithTable}
${markdownWithCode}
      `;

      const { container } = render(
        <Streamdown showControls={{ table: false }}>
          {combined}
        </Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const tableButtons = tableWrapper?.querySelectorAll("button");
      expect(tableButtons?.length).toBe(0);

      // Code controls should still show since not specified
      const codeButtons = container.querySelectorAll('[data-code-block-header] button');
      expect(codeButtons?.length).toBeGreaterThan(0);
    });
  });

  describe("with custom components", () => {
    it("should respect showControls with custom component overrides", () => {
      const CustomParagraph = ({ children }: any) => (
        <p className="custom-paragraph">{children}</p>
      );

      const { container } = render(
        <Streamdown
          showControls={false}
          components={{ p: CustomParagraph }}
        >
          {markdownWithTable}
        </Streamdown>
      );

      const tableWrapper = container.querySelector('[data-streamdown="table-wrapper"]');
      const buttons = tableWrapper?.querySelectorAll("button");

      expect(buttons?.length).toBe(0);
    });
  });
});