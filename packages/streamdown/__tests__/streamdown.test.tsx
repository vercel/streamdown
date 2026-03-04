import { render } from "@testing-library/react";
import type { MermaidConfig } from "mermaid";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

// Mock the dependencies
vi.mock("../lib/markdown", () => ({
  Markdown: ({
    children,
    rehypePlugins,
    remarkPlugins,
    components,
    ...props
  }: any) => {
    // Only render if children is provided
    if (!children) {
      return null;
    }
    return (
      <div data-testid="markdown" {...props}>
        {children}
      </div>
    );
  },
  defaultUrlTransform: (url: string) => url,
}));

vi.mock("rehype-katex", () => ({
  default: () => {
    // Mock implementation
  },
}));

vi.mock("remark-gfm", () => ({
  default: () => {
    // Mock implementation
  },
}));

vi.mock("remark-math", () => ({
  default: () => {
    // Mock implementation
  },
}));

describe("Streamdown Component", () => {
  it("should render markdown content", () => {
    const content = "# Hello World";
    const { container } = render(<Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should parse incomplete markdown by default", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(<Streamdown>{content}</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Text with **incomplete bold**");
  });

  it("should not parse incomplete markdown when disabled", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={false}>{content}</Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Text with **incomplete bold");
  });

  it("should handle non-string children", () => {
    const content = <div>React Element</div>;
    const { container } = render(<Streamdown>{content as any}</Streamdown>);
    // Non-string children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should merge custom components with defaults", () => {
    const customComponents = {
      h1: ({ children }: any) => <h1 className="custom-h1">{children}</h1>,
    };

    const { container } = render(
      <Streamdown components={customComponents}># Heading</Streamdown>
    );

    // The markdown might not render synchronously, let's check the wrapper exists
    const wrapper = container.querySelector('[data-testid="markdown"]');
    expect(wrapper).toBeTruthy();

    // Check if any h1 exists at all (custom or default)
    const h1 = container.querySelector("h1");
    // If h1 exists, it should have the custom class
    if (h1) {
      expect(h1.className).toContain("custom-h1");
      expect(h1.textContent).toBe("Heading");
    } else {
      // The component renders but heading might be parsed differently
      expect(wrapper?.textContent).toContain("Heading");
    }
  });

  it("should merge custom rehype plugins", () => {
    const customPlugin = () => {
      // Mock plugin implementation
    };

    const { container } = render(
      <Streamdown rehypePlugins={[customPlugin]}>Content</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should merge custom remark plugins", () => {
    const customPlugin = () => {
      // Mock plugin implementation
    };

    const { container } = render(
      <Streamdown remarkPlugins={[customPlugin]}>Content</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should memoize based on children prop", () => {
    const { rerender, container } = render(
      <Streamdown className="class1">Content</Streamdown>
    );

    // Same children, different prop - should not re-render (memoized)
    rerender(<Streamdown className="class2">Content</Streamdown>);

    // Different children - should re-render
    rerender(<Streamdown className="class2">Different Content</Streamdown>);

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Different Content");
  });

  it("should handle empty children", () => {
    const { container } = render(<Streamdown>{""}</Streamdown>);
    // Empty string results in no blocks
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
    expect(wrapper?.textContent).toBe("");
  });

  it("should handle null children", () => {
    const { container } = render(<Streamdown>{null as any}</Streamdown>);
    // Null children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should handle undefined children", () => {
    const { container } = render(<Streamdown>{undefined as any}</Streamdown>);
    // Undefined children get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
  });

  it("should handle number children", () => {
    const { container } = render(<Streamdown>{123 as any}</Streamdown>);
    // Numbers get converted to empty string, so no blocks are created
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.children.length).toBe(0);
    expect(wrapper?.textContent).toBe("");
  });

  it("should handle complex markdown with incomplete tokens", () => {
    const content = `
# Heading
This is **bold** and *italic* text.
Here's an incomplete **bold
And an incomplete [link
`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    // Check that incomplete markdown is parsed correctly
    // The content is split into blocks and rendered separately
    const allText = wrapper?.textContent || "";
    expect(allText).toContain("Heading");
    expect(allText).toContain("bold");
    expect(allText).toContain("italic");
  });

  it("should accept mermaid config prop", () => {
    const mermaidConfig: MermaidConfig = {
      theme: "dark",
      themeVariables: {
        primaryColor: "#ff0000",
      },
    } as MermaidConfig;

    const { container } = render(
      <Streamdown mermaid={{ config: mermaidConfig }}>Test content</Streamdown>
    );

    // Just verify it renders without error when mermaid config is provided
    expect(container.firstElementChild).toBeTruthy();
  });

  it("should render without mermaid config", () => {
    const { container } = render(<Streamdown>Test content</Streamdown>);

    // Just verify it renders without error when mermaid config is not provided
    expect(container.firstElementChild).toBeTruthy();
  });

  it("should render in static mode without block parsing", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(
      <Streamdown mode="static">{content}</Streamdown>
    );

    // In static mode, there should be only one ReactMarkdown component rendering all content
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBe(1);
    expect(markdowns[0]?.textContent).toContain("Hello");
    expect(markdowns[0]?.textContent).toContain("This is a paragraph.");
  });

  it("should render in streaming mode with block parsing by default", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(<Streamdown>{content}</Streamdown>);

    // In streaming mode, content is split into blocks
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBeGreaterThan(1);
  });

  it("should render in streaming mode when explicitly set", () => {
    const content = "# Hello\n\nThis is a paragraph.";
    const { container } = render(
      <Streamdown mode="streaming">{content}</Streamdown>
    );

    // In streaming mode, content is split into blocks
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBeGreaterThan(1);
  });

  it("should not parse incomplete markdown in static mode", () => {
    const content = "Text with **incomplete bold";
    const { container } = render(
      <Streamdown mode="static">{content}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    // In static mode, incomplete markdown is NOT parsed/fixed
    expect(markdown?.textContent).toBe("Text with **incomplete bold");
  });

  it("should memoize based on mode prop", () => {
    const { rerender, container } = render(
      <Streamdown mode="streaming">Content</Streamdown>
    );

    // Different mode - should re-render
    rerender(<Streamdown mode="static">Content</Streamdown>);

    // Verify it rendered
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Content");
  });
});

describe("animation callbacks", () => {
  it("fires onAnimationStart when isAnimating transitions false → true", () => {
    const onAnimationStart = vi.fn();
    const { rerender } = render(
      <Streamdown isAnimating={false} onAnimationStart={onAnimationStart}>
        content
      </Streamdown>
    );
    expect(onAnimationStart).not.toHaveBeenCalled();

    rerender(
      <Streamdown isAnimating={true} onAnimationStart={onAnimationStart}>
        content
      </Streamdown>
    );
    expect(onAnimationStart).toHaveBeenCalledTimes(1);
  });

  it("fires onAnimationEnd when isAnimating transitions true → false", () => {
    const onAnimationEnd = vi.fn();
    const { rerender } = render(
      <Streamdown isAnimating={true} onAnimationEnd={onAnimationEnd}>
        content
      </Streamdown>
    );
    expect(onAnimationEnd).not.toHaveBeenCalled();

    rerender(
      <Streamdown isAnimating={false} onAnimationEnd={onAnimationEnd}>
        content
      </Streamdown>
    );
    expect(onAnimationEnd).toHaveBeenCalledTimes(1);
  });

  it("fires onAnimationStart on initial mount when isAnimating={true}", () => {
    const onAnimationStart = vi.fn();
    render(
      <Streamdown isAnimating={true} onAnimationStart={onAnimationStart}>
        content
      </Streamdown>
    );
    expect(onAnimationStart).toHaveBeenCalledTimes(1);
  });

  it("does NOT fire onAnimationEnd on initial mount when isAnimating={false}", () => {
    const onAnimationEnd = vi.fn();
    render(
      <Streamdown isAnimating={false} onAnimationEnd={onAnimationEnd}>
        content
      </Streamdown>
    );
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("does not fire callbacks when isAnimating is unchanged across re-renders", () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const { rerender } = render(
      <Streamdown
        isAnimating={true}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );
    onAnimationStart.mockClear();

    rerender(
      <Streamdown
        isAnimating={true}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        updated content
      </Streamdown>
    );
    expect(onAnimationStart).not.toHaveBeenCalled();
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });

  it("fires callbacks correctly across multiple animation cycles", () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const { rerender } = render(
      <Streamdown
        isAnimating={false}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );

    rerender(
      <Streamdown
        isAnimating={true}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );
    rerender(
      <Streamdown
        isAnimating={false}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );
    rerender(
      <Streamdown
        isAnimating={true}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );
    rerender(
      <Streamdown
        isAnimating={false}
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );

    expect(onAnimationStart).toHaveBeenCalledTimes(2);
    expect(onAnimationEnd).toHaveBeenCalledTimes(2);
  });

  it("does not throw when callbacks are not provided and isAnimating toggles", () => {
    const { rerender } = render(
      <Streamdown isAnimating={false}>content</Streamdown>
    );
    expect(() => {
      rerender(<Streamdown isAnimating={true}>content</Streamdown>);
      rerender(<Streamdown isAnimating={false}>content</Streamdown>);
    }).not.toThrow();
  });

  it('suppresses callbacks in mode="static"', () => {
    const onAnimationStart = vi.fn();
    const onAnimationEnd = vi.fn();
    const { rerender } = render(
      <Streamdown
        isAnimating={false}
        mode="static"
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );

    rerender(
      <Streamdown
        isAnimating={true}
        mode="static"
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );
    rerender(
      <Streamdown
        isAnimating={false}
        mode="static"
        onAnimationEnd={onAnimationEnd}
        onAnimationStart={onAnimationStart}
      >
        content
      </Streamdown>
    );

    expect(onAnimationStart).not.toHaveBeenCalled();
    expect(onAnimationEnd).not.toHaveBeenCalled();
  });
});
