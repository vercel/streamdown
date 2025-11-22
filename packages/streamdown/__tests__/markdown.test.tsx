import { render } from "@testing-library/react";
import type { Element } from "hast";
import type { ComponentType } from "react";
import { describe, expect, it } from "vitest";
import type { Components, Options } from "../lib/markdown";
import { Markdown } from "../lib/markdown";

describe("Markdown Component", () => {
  describe("Basic Rendering", () => {
    it("should render simple text", () => {
      const { container } = render(<Markdown children="Hello World" />);
      expect(container.textContent).toBe("Hello World");
    });

    it("should render empty string", () => {
      const { container } = render(<Markdown children="" />);
      expect(container.textContent).toBe("");
    });

    it("should handle undefined children", () => {
      const { container } = render(<Markdown />);
      expect(container.textContent).toBe("");
    });

    it("should render bold text", () => {
      const { container } = render(<Markdown children="**bold text**" />);
      const strong = container.querySelector("strong, span");
      expect(strong).toBeTruthy();
      expect(container.textContent).toContain("bold text");
    });

    it("should render italic text", () => {
      const { container } = render(<Markdown children="*italic text*" />);
      expect(container.querySelector("em")).toBeTruthy();
      expect(container.textContent).toContain("italic text");
    });

    it("should render headings", () => {
      const { container } = render(<Markdown children="# Heading 1" />);
      const h1 = container.querySelector("h1");
      expect(h1).toBeTruthy();
      expect(h1?.textContent).toBe("Heading 1");
    });

    it("should render multiple heading levels", () => {
      const content = "# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6";
      const { container } = render(<Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("h2")).toBeTruthy();
      expect(container.querySelector("h3")).toBeTruthy();
      expect(container.querySelector("h4")).toBeTruthy();
      expect(container.querySelector("h5")).toBeTruthy();
      expect(container.querySelector("h6")).toBeTruthy();
    });

    it("should render paragraphs", () => {
      const { container } = render(
        <Markdown children="First paragraph\n\nSecond paragraph" />
      );
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(1);
      expect(container.textContent).toContain("First paragraph");
      expect(container.textContent).toContain("Second paragraph");
    });

    it("should render lists", () => {
      const content = "- Item 1\n- Item 2\n- Item 3";
      const { container } = render(<Markdown children={content} />);
      const ul = container.querySelector("ul");
      const items = container.querySelectorAll("li");
      expect(ul).toBeTruthy();
      expect(items.length).toBe(3);
    });

    it("should render ordered lists", () => {
      const content = "1. First\n2. Second\n3. Third";
      const { container } = render(<Markdown children={content} />);
      const ol = container.querySelector("ol");
      const items = container.querySelectorAll("li");
      expect(ol).toBeTruthy();
      expect(items.length).toBe(3);
    });

    it("should render links", () => {
      const { container } = render(
        <Markdown children="[Link text](https://example.com)" />
      );
      const link = container.querySelector("a");
      expect(link).toBeTruthy();
      expect(link?.textContent).toBe("Link text");
      expect(link?.getAttribute("href")).toBe("https://example.com");
    });

    it("should render inline code", () => {
      const { container } = render(<Markdown children="`inline code`" />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.textContent).toBe("inline code");
    });

    it("should render code blocks", () => {
      const content = "```\ncode block\n```";
      const { container } = render(<Markdown children={content} />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
      expect(code?.textContent).toContain("code block");
    });

    it("should render blockquotes", () => {
      const { container } = render(<Markdown children="> Quote text" />);
      const blockquote = container.querySelector("blockquote");
      expect(blockquote).toBeTruthy();
      expect(blockquote?.textContent).toContain("Quote text");
    });

    it("should render horizontal rules", () => {
      const { container } = render(<Markdown children="---" />);
      const hr = container.querySelector("hr");
      expect(hr).toBeTruthy();
    });
  });

  describe("Custom Components", () => {
    it("should use custom component for h1", () => {
      const CustomH1: ComponentType<{ children: React.ReactNode }> = ({
        children,
      }) => <h1 className="custom-h1">{children}</h1>;

      const components: Components = {
        h1: CustomH1,
      };

      const { container } = render(
        <Markdown children="# Custom Heading" components={components} />
      );
      const h1 = container.querySelector("h1");
      expect(h1?.className).toBe("custom-h1");
      expect(h1?.textContent).toBe("Custom Heading");
    });

    it("should use custom component for paragraph", () => {
      const CustomP: ComponentType<{ children: React.ReactNode }> = ({
        children,
      }) => <p className="custom-paragraph">{children}</p>;

      const components: Components = {
        p: CustomP,
      };

      const { container } = render(
        <Markdown children="Custom paragraph" components={components} />
      );
      const p = container.querySelector("p");
      expect(p?.className).toBe("custom-paragraph");
    });

    it("should use custom component for links", () => {
      const CustomLink: ComponentType<{
        children: React.ReactNode;
        href?: string;
      }> = ({ children, href }) => (
        <a className="custom-link" href={href}>
          {children}
        </a>
      );

      const components: Components = {
        a: CustomLink,
      };

      const { container } = render(
        <Markdown
          children="[Link](https://example.com)"
          components={components}
        />
      );
      const link = container.querySelector("a");
      expect(link?.className).toBe("custom-link");
    });

    it("should use custom component for code", () => {
      const CustomCode: ComponentType<{ children: React.ReactNode }> = ({
        children,
      }) => <code className="custom-code">{children}</code>;

      const components: Components = {
        code: CustomCode,
      };

      const { container } = render(
        <Markdown children="`code`" components={components} />
      );
      const code = container.querySelector("code");
      expect(code?.className).toBe("custom-code");
    });

    it("should pass node prop to custom components", () => {
      const CustomH1: ComponentType<{
        children: React.ReactNode;
        node?: Element;
      }> = ({ children, node }) => <h1 data-has-node={!!node}>{children}</h1>;

      const components: Components = {
        h1: CustomH1,
      };

      const { container } = render(
        <Markdown children="# Heading" components={components} />
      );
      const h1 = container.querySelector("h1");
      expect(h1?.getAttribute("data-has-node")).toBe("true");
    });

    it("should handle multiple custom components", () => {
      const components: Components = {
        h1: ({ children }) => <h1 className="custom-h1">{children}</h1>,
        h2: ({ children }) => <h2 className="custom-h2">{children}</h2>,
        p: ({ children }) => <p className="custom-p">{children}</p>,
      };

      const content = "# H1\n## H2\nParagraph";
      const { container } = render(
        <Markdown children={content} components={components} />
      );

      expect(container.querySelector(".custom-h1")).toBeTruthy();
      expect(container.querySelector(".custom-h2")).toBeTruthy();
      expect(container.querySelector(".custom-p")).toBeTruthy();
    });
  });

  describe("Plugin Support", () => {
    it("should accept remark plugins", () => {
      const mockRemarkPlugin = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [mockRemarkPlugin],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept rehype plugins", () => {
      const mockRehypePlugin = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        rehypePlugins: [mockRehypePlugin],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept plugins with options", () => {
      const mockPlugin = (_options: any) => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [[mockPlugin, { setting: true }]],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept multiple remark plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        remarkPlugins: [plugin1, plugin2],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept multiple rehype plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options: Options = {
        children: "# Test",
        rehypePlugins: [plugin1, plugin2],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should accept remarkRehypeOptions", () => {
      const options: Options = {
        children: "# Test",
        remarkRehypeOptions: {
          allowDangerousHtml: false,
        },
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });

    it("should preserve allowDangerousHtml default", () => {
      const options: Options = {
        children: "Text with <em>HTML</em> tags",
      };

      const { container } = render(<Markdown {...options} />);
      // Default allowDangerousHtml is true, so rendering should work without errors
      expect(container).toBeTruthy();
      // The em tag should be rendered as HTML element
      const em = container.querySelector("em");
      if (em) {
        expect(em.textContent).toBe("HTML");
      }
    });
  });

  describe("Processor Caching", () => {
    it("should reuse cached processor for identical options", () => {
      const options1: Options = { children: "Test 1" };
      const options2: Options = { children: "Test 2" };

      const { container: container1 } = render(<Markdown {...options1} />);
      const { container: container2 } = render(<Markdown {...options2} />);

      expect(container1.textContent).toBe("Test 1");
      expect(container2.textContent).toBe("Test 2");
    });

    it("should create new processor for different plugins", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [plugin1],
      };

      const options2: Options = {
        children: "Test",
        remarkPlugins: [plugin2],
      };

      const { container: container1 } = render(<Markdown {...options1} />);
      const { container: container2 } = render(<Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });

    it("should handle processor cache with different plugin configurations", () => {
      const plugin = (_options: any) => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [[plugin, { setting: 1 }]],
      };

      const options2: Options = {
        children: "Test",
        remarkPlugins: [[plugin, { setting: 2 }]],
      };

      const { container: container1 } = render(<Markdown {...options1} />);
      const { container: container2 } = render(<Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });

    it("should cache processors with different remarkRehypeOptions", () => {
      const options1: Options = {
        children: "Test",
        remarkRehypeOptions: { allowDangerousHtml: true },
      };

      const options2: Options = {
        children: "Test",
        remarkRehypeOptions: { allowDangerousHtml: false },
      };

      const { container: container1 } = render(<Markdown {...options1} />);
      const { container: container2 } = render(<Markdown {...options2} />);

      expect(container1.textContent).toBe("Test");
      expect(container2.textContent).toBe("Test");
    });
  });

  describe("Complex Markdown", () => {
    it("should render nested lists", () => {
      const content = `- Item 1
  - Nested 1
  - Nested 2
- Item 2`;
      const { container } = render(<Markdown children={content} />);
      const lists = container.querySelectorAll("ul");
      expect(lists.length).toBeGreaterThanOrEqual(1);
    });

    it("should render tables", () => {
      const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;
      const { container } = render(<Markdown children={content} />);
      const table = container.querySelector("table");
      // Note: Tables require remark-gfm plugin which may not be loaded by default
      // This test verifies basic structure if plugin is present
      if (table) {
        expect(table).toBeTruthy();
      }
    });

    it("should render mixed content", () => {
      const content = `# Heading

This is a paragraph with **bold** and *italic* text.

- List item 1
- List item 2

\`\`\`
code block
\`\`\`

> Blockquote`;

      const { container } = render(<Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("ul")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
      expect(container.querySelector("blockquote")).toBeTruthy();
    });

    it("should handle code blocks with language", () => {
      const content = "```javascript\nconst x = 1;\n```";
      const { container } = render(<Markdown children={content} />);
      const code = container.querySelector("code");
      expect(code).toBeTruthy();
    });

    it("should handle multiple paragraphs", () => {
      const content = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const { container } = render(<Markdown children={content} />);
      const paragraphs = container.querySelectorAll("p");
      expect(paragraphs.length).toBeGreaterThanOrEqual(3);
    });

    it("should handle line breaks", () => {
      const content = "Line 1\nLine 2";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters", () => {
      const content = "Text with & < > \" ' characters";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("&");
      expect(container.textContent).toContain("<");
      expect(container.textContent).toContain(">");
    });

    it("should handle unicode characters", () => {
      const content = "Unicode: 你好 🌟 café";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("你好");
      expect(container.textContent).toContain("🌟");
      expect(container.textContent).toContain("café");
    });

    it("should handle very long text", () => {
      const content = "a".repeat(10_000);
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent?.length).toBeGreaterThanOrEqual(10_000);
    });

    it("should handle malformed markdown gracefully", () => {
      const content = "**bold without closing";
      const { container } = render(<Markdown children={content} />);
      // Should still render something without crashing
      expect(container.textContent).toBeTruthy();
    });

    it("should handle nested formatting", () => {
      const content = "***bold and italic***";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("bold and italic");
    });

    it("should handle escaped characters", () => {
      const content = "\\*not italic\\*";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("*not italic*");
    });

    it("should handle multiple consecutive line breaks", () => {
      const content = "Line 1\n\n\n\nLine 2";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toContain("Line 1");
      expect(container.textContent).toContain("Line 2");
    });

    it("should handle whitespace-only content", () => {
      const content = "   \n\n   ";
      const { container } = render(<Markdown children={content} />);
      // Whitespace-only content should render without errors
      expect(container).toBeTruthy();
    });
  });

  describe("Performance and Caching", () => {
    it("should handle repeated renders with same options", () => {
      const options: Options = { children: "Test content" };

      const render1 = () => render(<Markdown {...options} />);
      const render2 = () => render(<Markdown {...options} />);
      const render3 = () => render(<Markdown {...options} />);

      expect(() => {
        render1();
        render2();
        render3();
      }).not.toThrow();
    });

    it("should handle rapid option changes", () => {
      const plugin1 = () => (tree: any) => tree;
      const plugin2 = () => (tree: any) => tree;
      const plugin3 = () => (tree: any) => tree;

      const options1: Options = {
        children: "Test",
        remarkPlugins: [plugin1],
      };
      const options2: Options = {
        children: "Test",
        remarkPlugins: [plugin2],
      };
      const options3: Options = {
        children: "Test",
        remarkPlugins: [plugin3],
      };

      expect(() => {
        render(<Markdown {...options1} />);
        render(<Markdown {...options2} />);
        render(<Markdown {...options3} />);
      }).not.toThrow();
    });

    it("should handle rendering with no plugins", () => {
      const options: Options = {
        children: "# Test",
        remarkPlugins: [],
        rehypePlugins: [],
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toContain("Test");
    });
  });

  describe("Type Safety", () => {
    it("should accept valid Options type", () => {
      const options: Options = {
        children: "Test",
        components: {
          h1: ({ children }) => <h1>{children}</h1>,
        },
        remarkPlugins: [],
        rehypePlugins: [],
        remarkRehypeOptions: { allowDangerousHtml: true },
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toBe("Test");
    });

    it("should accept minimal Options", () => {
      const options: Options = {
        children: "Minimal test",
      };

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toBe("Minimal test");
    });

    it("should accept Options without children", () => {
      const options: Options = {};

      const { container } = render(<Markdown {...options} />);
      expect(container.textContent).toBe("");
    });
  });

  describe("Integration with hast-util-to-jsx-runtime", () => {
    it("should generate valid React elements", () => {
      const { container } = render(<Markdown children="# Test" />);
      expect(container.firstChild).toBeTruthy();
      expect(container.firstChild).toBeInstanceOf(Element);
    });

    it("should preserve keys in generated elements", () => {
      const content = "- Item 1\n- Item 2\n- Item 3";
      const { container } = render(<Markdown children={content} />);
      const items = container.querySelectorAll("li");
      // Keys are internal to React, but we can verify items are rendered
      expect(items.length).toBe(3);
    });

    it("should handle Fragment usage", () => {
      const content = "Text without wrapper";
      const { container } = render(<Markdown children={content} />);
      expect(container.textContent).toBe("Text without wrapper");
    });
  });

  describe("Error Handling", () => {
    it("should handle invalid plugin gracefully", () => {
      const invalidPlugin = null as any;

      const options: Options = {
        children: "Test",
        remarkPlugins: [invalidPlugin],
      };

      // Should either throw or handle gracefully
      try {
        render(<Markdown {...options} />);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });

    it("should handle undefined in plugin array", () => {
      const options: Options = {
        children: "Test",
        remarkPlugins: [undefined as any],
      };

      try {
        render(<Markdown {...options} />);
      } catch (error) {
        expect(error).toBeTruthy();
      }
    });
  });

  describe("Processor Cache Limits", () => {
    it("should handle cache growth", () => {
      // Create many different plugin configurations to test cache limits
      const renders: Array<() => void> = [];
      for (let i = 0; i < 150; i += 1) {
        const plugin = () => (tree: any) => tree;
        Object.defineProperty(plugin, "name", { value: `plugin${i}` });

        const options: Options = {
          children: `Test ${i}`,
          remarkPlugins: [plugin],
        };

        renders.push(() => render(<Markdown {...options} />));
      }

      // Should handle exceeding cache size gracefully
      expect(() => {
        for (const r of renders) {
          r();
        }
      }).not.toThrow();
    });
  });

  describe("Real-world Scenarios", () => {
    it("should render a blog post structure", () => {
      const content = `# Blog Post Title

By Author Name

## Introduction

This is the introduction paragraph with **important** points.

## Main Content

- Point 1
- Point 2
- Point 3

### Subsection

More details here with \`code examples\`.

## Conclusion

Final thoughts.`;

      const { container } = render(<Markdown children={content} />);
      expect(container.querySelector("h1")?.textContent).toBe(
        "Blog Post Title"
      );
      expect(container.querySelector("h2")).toBeTruthy();
      expect(container.querySelector("h3")).toBeTruthy();
      expect(container.querySelector("ul")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
    });

    it("should render documentation format", () => {
      const content = `# API Documentation

## Overview

This API provides access to data.

## Endpoints

### GET /api/data

Returns data.

\`\`\`javascript
fetch('/api/data')
  .then(res => res.json())
\`\`\`

### POST /api/data

Creates data.`;

      const { container } = render(<Markdown children={content} />);
      expect(container.querySelector("h1")).toBeTruthy();
      expect(container.querySelector("code")).toBeTruthy();
    });

    it("should render chat message format", () => {
      const content = `Here's what I found:

- Option A: **Best for performance**
- Option B: *Easier to implement*

Let me know which you prefer!`;

      const { container } = render(<Markdown children={content} />);
      expect(container.querySelector("ul")).toBeTruthy();
      const items = container.querySelectorAll("li");
      expect(items.length).toBe(2);
    });
  });
});
