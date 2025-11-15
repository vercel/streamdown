import { render } from "@testing-library/react";
import React from "react";
import type { Options } from "react-markdown";
import { describe, expect, it, vi } from "vitest";
import { components as importedComponents } from "../lib/components";
import { MermaidLoaderContext } from "../index";

// Type assertion: we know all components are defined in our implementation
type RequiredComponents = Required<NonNullable<Options["components"]>>;
const components = importedComponents as RequiredComponents;
const mockLoader = vi.fn(async () => ({
  initialize: vi.fn(),
  render: vi.fn().mockResolvedValue({ svg: "<svg />" }),
}));

describe("Markdown Components", () => {
  describe("List Components", () => {
    it("should render ordered list with correct classes", () => {
      const OL = components.ol!;
      const { container } = render(
        <OL node={null as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </OL>
      );
      const ol = container.querySelector("ol");
      expect(ol).toBeTruthy();
      expect(ol?.className).toContain("ml-4");
      expect(ol?.className).toContain("list-decimal");
      expect(ol?.className).toContain("list-outside");
    });

    it("should render unordered list with correct classes", () => {
      const UL = components.ul!;
      const { container } = render(
        <UL node={null as any}>
          <li>Item 1</li>
          <li>Item 2</li>
        </UL>
      );
      const ul = container.querySelector("ul");
      expect(ul).toBeTruthy();
      expect(ul?.className).toContain("ml-4");
      expect(ul?.className).toContain("list-disc");
      expect(ul?.className).toContain("list-outside");
    });

    it("should render list item with correct classes", () => {
      const LI = components.li!;
      const { container } = render(
        <LI node={null as any}>List item content</LI>
      );
      const li = container.querySelector("li");
      expect(li).toBeTruthy();
      expect(li?.className).toContain("py-1");
    });
  });

  describe("Heading Components", () => {
    it("should render h1 with correct classes", () => {
      const H1 = components.h1!;
      const { container } = render(<H1 node={null as any}>Heading 1</H1>);
      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.className).toContain("mt-6");
      expect(h1?.className).toContain("mb-2");
      expect(h1?.className).toContain("font-semibold");
      expect(h1?.className).toContain("text-3xl");
    });

    it("should render h2 with correct classes", () => {
      const H2 = components.h2!;
      const { container } = render(<H2 node={null as any}>Heading 2</H2>);
      const h2 = container.querySelector("h2");
      expect(h2).toBeTruthy();
      expect(h2?.className).toContain("text-2xl");
    });

    it("should render h3 with correct classes", () => {
      const H3 = components.h3!;
      const { container } = render(<H3 node={null as any}>Heading 3</H3>);
      const h3 = container.querySelector("h3");
      expect(h3).toBeTruthy();
      expect(h3?.className).toContain("text-xl");
    });

    it("should render h4 with correct classes", () => {
      const H4 = components.h4!;
      const { container } = render(<H4 node={null as any}>Heading 4</H4>);
      const h4 = container.querySelector("h4");
      expect(h4).toBeTruthy();
      expect(h4?.className).toContain("text-lg");
    });

    it("should render h5 with correct classes", () => {
      const H5 = components.h5!;
      const { container } = render(<H5 node={null as any}>Heading 5</H5>);
      const h5 = container.querySelector("h5");
      expect(h5).toBeTruthy();
      expect(h5?.className).toContain("text-base");
    });

    it("should render h6 with correct classes", () => {
      const H6 = components.h6!;
      const { container } = render(<H6 node={null as any}>Heading 6</H6>);
      const h6 = container.querySelector("h6");
      expect(h6).toBeTruthy();
      expect(h6?.className).toContain("text-sm");
    });
  });

  describe("Text Formatting Components", () => {
    it("should render strong with correct classes", () => {
      const Strong = components.strong!;
      const { container } = render(
        <Strong node={null as any}>Bold text</Strong>
      );
      const span = container.querySelector("span");
      expect(span).toBeTruthy();
      expect(span?.className).toContain("font-semibold");
    });

    it("should render link with correct attributes and classes", () => {
      const A = components.a!;
      const { container } = render(
        <A href="https://example.com" node={null as any}>
          Link text
        </A>
      );
      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.className).toContain("wrap-anywhere");
      expect(link?.className).toContain("font-medium");
      expect(link?.className).toContain("text-primary");
      expect(link?.className).toContain("underline");
      expect(link?.getAttribute("rel")).toBe("noreferrer");
      expect(link?.getAttribute("target")).toBe("_blank");
    });

    it("should mark incomplete links with data attribute", () => {
      const A = components.a!;
      const { container } = render(
        <A href="streamdown:incomplete-link" node={null as any}>
          Incomplete link text
        </A>
      );
      // Should render a normal anchor with data-incomplete attribute
      const link = container.querySelector('a[data-streamdown="link"]');
      expect(link).toBeTruthy();
      expect(link?.getAttribute("data-incomplete")).toBe("true");
      expect(link?.getAttribute("href")).toBe("streamdown:incomplete-link");
      expect(link?.textContent).toBe("Incomplete link text");
    });

    it("should render blockquote with correct classes", () => {
      const Blockquote = components.blockquote!;
      const { container } = render(
        <Blockquote node={null as any}>Quote text</Blockquote>
      );
      const blockquote = container.querySelector("blockquote");
      expect(blockquote).toBeTruthy();
      expect(blockquote?.className).toContain("my-4");
      expect(blockquote?.className).toContain("border-l-4");
      expect(blockquote?.className).toContain("pl-4");
      expect(blockquote?.className).toContain("italic");
    });
  });

  describe("Code Components", () => {
    it("should render inline code with correct classes", () => {
      const Code = components.code!;
      const { container } = render(
        <Code
          node={
            {
              position: {
                start: { line: 1, column: 1 },
                end: { line: 1, column: 10 },
              },
            } as any
          }
        >
          code
        </Code>
      );
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.className).toContain("rounded");
      expect(code?.className).toContain("bg-muted");
      expect(code?.className).toContain("px-1.5");
      expect(code?.className).toContain("py-0.5");
      expect(code?.className).toContain("font-mono");
      expect(code?.className).toContain("text-sm");
    });

    it("should render block code without inline styles", () => {
      const Code = components.code!;
      const { container } = render(
        <Code
          node={
            {
              position: {
                start: { line: 1, column: 1 },
                end: { line: 2, column: 10 },
              },
            } as any
          }
        >
          code
        </Code>
      );

      // Block code renders a CodeBlock component with copy button
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
      expect(codeBlock?.getAttribute("data-language")).toBe("");

      // Should contain copy button
      const copyButton = container.querySelector("button");
      expect(copyButton).toBeTruthy();
    });

    it("should render pre with code block", () => {
      const Pre = components.pre!;
      const codeElement = React.createElement("code", {
        children: "const x = 1;",
      });
      const { container } = render(<Pre node={null as any}>{codeElement}</Pre>);
      // The pre component returns its children
      // The code element should be present as a child
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe("const x = 1;");
    });

    it("should extract language from code className", () => {
      const Code = components.code!;
      // Test the code component directly since it handles language extraction
      const { container } = render(
        <Code
          className="language-javascript"
          node={
            {
              position: {
                start: { line: 1, column: 1 },
                end: { line: 2, column: 10 },
              },
            } as any
          }
        >
          const x = 1;
        </Code>
      );
      // Code component with multi-line position renders a CodeBlock with language
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).toBeTruthy();
      expect(codeBlock?.getAttribute("data-language")).toBe("javascript");
    });

    it("should extract code from children in pre component", () => {
      const Pre = components.pre!;
      const { container } = render(
        <Pre node={null as any}>plain text code</Pre>
      );
      // The pre component returns its children directly
      expect(container.textContent).toBe("plain text code");
    });
    it("should render mermaid block with correct structure", () => {
      const Code = components.code!;
      const { container } = render(
        <MermaidLoaderContext.Provider value={mockLoader}>
          <Code
            className="language-mermaid"
            node={
              {
                position: {
                  start: { line: 1, column: 1 },
                  end: { line: 2, column: 10 },
                },
              } as any
            }
          >
            {"graph TD; A-->B;"}
          </Code>
        </MermaidLoaderContext.Provider>
      );
      
      // Verify mermaid block structure is created
      const mermaidBlock = container.querySelector(
        '[data-streamdown="mermaid-block"]'
      );
      expect(mermaidBlock).toBeTruthy();
      expect(mermaidBlock?.className).toContain("group");
      expect(mermaidBlock?.className).toContain("relative");
      expect(mermaidBlock?.className).toContain("rounded-xl");
      expect(mermaidBlock?.className).toContain("border");
      
      // Note: Full Mermaid rendering is tested in mermaid.test.tsx with proper mocks
    });
  });

  describe("Table Components", () => {
    it("should render table with wrapper div", () => {
      const Table = components.table!;
      const { container } = render(
        <Table node={null as any}>
          <tbody>
            <tr>
              <td>Cell</td>
            </tr>
          </tbody>
        </Table>
      );
      const wrapper = container.querySelector("div");
      expect(wrapper).toBeTruthy();
      expect(wrapper?.className).toContain("my-4");
      expect(wrapper?.className).toContain("flex");
      expect(wrapper?.className).toContain("flex-col");

      // The overflow-x-auto is on the inner div that wraps the table
      const tableWrapper = wrapper?.querySelector("div.overflow-x-auto");
      expect(tableWrapper).toBeTruthy();

      const table = tableWrapper?.querySelector("table");
      expect(table).toBeTruthy();
      expect(table?.className).toContain("w-full");
      expect(table?.className).toContain("border-collapse");
      expect(table?.className).toContain("border");
    });

    it("should render thead with correct classes", () => {
      const THead = components.thead!;
      const { container } = render(
        <THead node={null as any}>
          <tr>
            <th>Header</th>
          </tr>
        </THead>
      );
      const thead = container.querySelector("thead");
      expect(thead).toBeTruthy();
      expect(thead?.className).toContain("bg-muted/80");
    });

    it("should render tbody with correct classes", () => {
      const TBody = components.tbody!;
      const { container } = render(
        <TBody node={null as any}>
          <tr>
            <td>Cell</td>
          </tr>
        </TBody>
      );
      const tbody = container.querySelector("tbody");
      expect(tbody).toBeTruthy();
      expect(tbody?.className).toContain("divide-y");
      expect(tbody?.className).toContain("divide-border");
      expect(tbody?.className).toContain("bg-muted/40");
    });

    it("should render tr with correct classes", () => {
      const TR = components.tr!;
      const { container } = render(
        <TR node={null as any}>
          <td>Cell</td>
        </TR>
      );
      const tr = container.querySelector("tr");
      expect(tr).toBeTruthy();
      expect(tr?.className).toContain("border-b");
      expect(tr?.className).toContain("border-border");
    });

    it("should render th with correct classes", () => {
      const TH = components.th!;
      const { container } = render(<TH node={null as any}>Header</TH>);
      const th = container.querySelector("th");
      expect(th).toBeTruthy();
      expect(th?.className).toContain("whitespace-nowrap");
      expect(th?.className).toContain("px-4");
      expect(th?.className).toContain("py-2");
      expect(th?.className).toContain("text-left");
      expect(th?.className).toContain("font-semibold");
      expect(th?.className).toContain("text-sm");
    });

    it("should render td with correct classes", () => {
      const TD = components.td!;
      const { container } = render(<TD node={null as any}>Cell</TD>);
      const td = container.querySelector("td");
      expect(td).toBeTruthy();
      expect(td?.className).toContain("px-4");
      expect(td?.className).toContain("py-2");
      expect(td?.className).toContain("text-sm");
    });
  });

  describe("Other Components", () => {
    it("should render hr with correct classes", () => {
      const HR = components.hr!;
      const { container } = render(<HR node={null as any} />);
      const hr = container.querySelector("hr");
      expect(hr).toBeTruthy();
      expect(hr?.className).toContain("my-6");
      expect(hr?.className).toContain("border-border");
    });

    it("should render sup with correct classes", () => {
      const Sup = components.sup!;
      const { container } = render(<Sup node={null as any}>superscript</Sup>);
      const sup = container.querySelector("sup");
      expect(sup).toBeTruthy();
      expect(sup?.className).toContain("text-sm");
    });

    it("should render sub with correct classes", () => {
      const Sub = components.sub!;
      const { container } = render(<Sub node={null as any}>subscript</Sub>);
      const sub = container.querySelector("sub");
      expect(sub).toBeTruthy();
      expect(sub?.className).toContain("text-sm");
    });
  });

  describe("Custom className prop", () => {
    it("should merge custom className with default classes", () => {
      const H1 = components.h1!;
      const { container } = render(
        <H1 className="custom-class" node={null as any}>
          Heading
        </H1>
      );
      const h1 = container.querySelector("h1");
      expect(h1?.className).toContain("custom-class");
      expect(h1?.className).toContain("mt-6");
      expect(h1?.className).toContain("mb-2");
    });
  });
});
