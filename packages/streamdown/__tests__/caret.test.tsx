import { render } from "@testing-library/react";
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

describe("Caret Feature", () => {
  describe("Caret Rendering", () => {
    it("should render block caret when caret='block' and isAnimating=true", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          Streaming content...
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Check that the wrapper has the caret-related classes
      const className = wrapper?.className || "";
      expect(className).toContain("*:last:after:inline");
      expect(className).toContain("*:last:after:align-baseline");
      expect(className).toContain(
        "*:last:after:content-[var(--streamdown-caret)]"
      );

      // Check that the CSS custom property is set
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should render circle caret when caret='circle' and isAnimating=true", () => {
      const { container } = render(
        <Streamdown caret="circle" isAnimating={true}>
          Streaming content...
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Check that the wrapper has the caret-related classes
      const className = wrapper?.className || "";
      expect(className).toContain("*:last:after:inline");
      expect(className).toContain("*:last:after:align-baseline");
      expect(className).toContain(
        "*:last:after:content-[var(--streamdown-caret)]"
      );

      // Check that the CSS custom property is set
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ●"');
    });

    it("should not render caret when caret is undefined", () => {
      const { container } = render(
        <Streamdown isAnimating={true}>Streaming content...</Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Check that the wrapper does NOT have the caret-related classes
      const className = wrapper?.className || "";
      expect(className).not.toContain("*:last:after:inline");
      expect(className).not.toContain("*:last:after:align-baseline");
      expect(className).not.toContain(
        "*:last:after:content-[var(--streamdown-caret)]"
      );

      // Check that the style is not set
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should not render caret when isAnimating=false even with caret set", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={false}>
          Completed content...
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Check that the style is not set when isAnimating is false
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should not render caret when isAnimating is not provided (defaults to false)", () => {
      const { container } = render(
        <Streamdown caret="block">Content...</Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Check that the style is not set when isAnimating defaults to false
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });
  });

  describe("Caret State Changes", () => {
    it("should add caret when isAnimating changes from false to true", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={false}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");

      // Update isAnimating to true
      rerender(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should remove caret when isAnimating changes from true to false", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Update isAnimating to false
      rerender(
        <Streamdown caret="block" isAnimating={false}>
          Content
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should change caret style when caret prop changes with content change", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Change caret to circle (also change content to trigger re-render due to memoization)
      rerender(
        <Streamdown caret="circle" isAnimating={true}>
          Content updated
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ●"');
    });

    it("should remove caret when caret prop is set to undefined with content change", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Remove caret (also change content to trigger re-render due to memoization)
      rerender(<Streamdown isAnimating={true}>Content updated</Streamdown>);

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });
  });

  describe("Caret with Different Modes", () => {
    it("should render caret in streaming mode", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true} mode="streaming">
          Content
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should not render caret in static mode even when isAnimating=true", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true} mode="static">
          Content
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      // In static mode, the caret classes and styles are not applied
      // because static mode uses a different rendering path
      const className = wrapper?.className || "";
      expect(className).not.toContain("*:last:after:inline");
    });
  });

  describe("Caret with Streaming Content", () => {
    it("should maintain caret during content updates", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          Initial content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Update content as if streaming
      rerender(
        <Streamdown caret="block" isAnimating={true}>
          Initial content with more text
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should work with empty content", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {""}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should render placeholder span for caret when content is empty", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {""}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();

      // Should have a span placeholder for the caret to attach to
      const placeholder = wrapper?.querySelector("span");
      expect(placeholder).toBeTruthy();
    });

    it("should not render placeholder span when not animating", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={false}>
          {""}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const placeholder = wrapper?.querySelector("span");
      expect(placeholder).toBeFalsy();
    });

    it("should not render placeholder span when caret is not set", () => {
      const { container } = render(
        <Streamdown isAnimating={true}>{""}</Streamdown>
      );

      const wrapper = container.firstElementChild;
      const placeholder = wrapper?.querySelector("span");
      expect(placeholder).toBeFalsy();
    });

    it("should work with markdown content", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          # Heading{"\n\n"}This is **bold** text
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should work with complete code blocks", () => {
      const { container } = render(
        <Streamdown caret="circle" isAnimating={true}>
          {`\`\`\`javascript
const x = 1;
\`\`\``}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ●"');
    });

    it("should hide caret when last block has incomplete code fence", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {`\`\`\`javascript
const x = 1;`}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");

      const className = wrapper?.className || "";
      expect(className).not.toContain("*:last:after:inline");
    });

    it("should restore caret when code fence completes", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          {`\`\`\`javascript
const x = 1;`}
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");

      rerender(
        <Streamdown caret="block" isAnimating={true}>
          {`\`\`\`javascript
const x = 1;
\`\`\``}
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should hide caret when last block contains a table", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {`| Name | Age |
| --- | --- |
| Alice | 30 |`}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");

      const className = wrapper?.className || "";
      expect(className).not.toContain("*:last:after:inline");
    });

    it("should hide caret when streaming an incomplete table", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {`| Name | Age |
| --- | --- |`}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should show caret when table is followed by regular text", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          {`| Name | Age |
| --- | --- |
| Alice | 30 |

Here is some text after the table`}
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      // The last block is regular text, not a table, so caret should show
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });
  });

  describe("Caret Memoization", () => {
    it("should not re-render when only caret prop changes due to memoization", () => {
      const { rerender, container } = render(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Change only caret prop (component won't re-render due to memoization)
      rerender(
        <Streamdown caret="circle" isAnimating={true}>
          Content
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      // Still shows block caret because component is memoized and doesn't include caret in comparison
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should memoize and update when isAnimating changes", () => {
      const { rerender, container } = render(
        <Streamdown caret="block" isAnimating={false}>
          Content
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");

      // Change isAnimating to true
      rerender(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });
  });

  describe("Caret with Custom Components", () => {
    it("should work with custom components", () => {
      const customComponents = {
        h1: ({ children }: any) => <h1 className="custom-h1">{children}</h1>,
      };

      const { container } = render(
        <Streamdown
          caret="block"
          components={customComponents}
          isAnimating={true}
        >
          # Custom Heading
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });
  });

  describe("Caret CSS Classes", () => {
    it("should apply correct CSS classes for caret when enabled", () => {
      const { container } = render(
        <Streamdown caret="block" isAnimating={true}>
          Content
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const className = wrapper?.className || "";

      // Verify all three caret-related classes are present
      expect(className).toContain("*:last:after:inline");
      expect(className).toContain("*:last:after:align-baseline");
      expect(className).toContain(
        "*:last:after:content-[var(--streamdown-caret)]"
      );
    });

    it("should not apply caret CSS classes when caret is disabled", () => {
      const { container } = render(
        <Streamdown isAnimating={true}>Content</Streamdown>
      );

      const wrapper = container.firstElementChild;
      const className = wrapper?.className || "";

      // Verify caret-related classes are NOT present
      expect(className).not.toContain("*:last:after:inline");
      expect(className).not.toContain("*:last:after:align-baseline");
      expect(className).not.toContain(
        "*:last:after:content-[var(--streamdown-caret)]"
      );
    });

    it("should preserve other classNames when caret is enabled", () => {
      const { container } = render(
        <Streamdown
          caret="block"
          className="custom-class another-class"
          isAnimating={true}
        >
          Content
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const className = wrapper?.className || "";

      // Verify custom classes are preserved
      expect(className).toContain("custom-class");
      expect(className).toContain("another-class");

      // And caret classes are added
      expect(className).toContain("*:last:after:inline");
    });
  });

  describe("Caret Type Safety", () => {
    it("should accept 'block' as valid caret value", () => {
      expect(() => {
        render(
          <Streamdown caret="block" isAnimating={true}>
            Content
          </Streamdown>
        );
      }).not.toThrow();
    });

    it("should accept 'circle' as valid caret value", () => {
      expect(() => {
        render(
          <Streamdown caret="circle" isAnimating={true}>
            Content
          </Streamdown>
        );
      }).not.toThrow();
    });

    it("should accept undefined as valid caret value", () => {
      expect(() => {
        render(<Streamdown isAnimating={true}>Content</Streamdown>);
      }).not.toThrow();
    });
  });

  describe("Real-world Usage Scenarios", () => {
    it("should simulate streaming chat message with caret", () => {
      const { container, rerender } = render(
        <Streamdown caret="block" isAnimating={true}>
          Hello
        </Streamdown>
      );

      let wrapper = container.firstElementChild;
      let style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Simulate streaming more content
      rerender(
        <Streamdown caret="block" isAnimating={true}>
          Hello, how can I help
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');

      // Simulate streaming completion
      rerender(
        <Streamdown caret="block" isAnimating={false}>
          Hello, how can I help you today?
        </Streamdown>
      );

      wrapper = container.firstElementChild;
      style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should support conditional caret for assistant messages only", () => {
      const messageRole = "assistant";
      const isLastMessage = true;

      const { container } = render(
        <Streamdown
          caret={messageRole === "assistant" && isLastMessage ? "block" : null}
          isAnimating={true}
        >
          Assistant response
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe('" ▋"');
    });

    it("should not show caret for non-assistant messages", () => {
      const messageRole = "user";
      const isLastMessage = true;

      const { container } = render(
        <Streamdown
          caret={messageRole === "assistant" && isLastMessage ? "block" : null}
          isAnimating={true}
        >
          User message
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });

    it("should not show caret for non-last messages", () => {
      const messageRole = "assistant";
      const isLastMessage = false;

      const { container } = render(
        <Streamdown
          caret={messageRole === "assistant" && isLastMessage ? "circle" : null}
          isAnimating={true}
        >
          Previous assistant message
        </Streamdown>
      );

      const wrapper = container.firstElementChild;
      const style = (wrapper as HTMLElement)?.style;
      expect(style?.getPropertyValue("--streamdown-caret")).toBe("");
    });
  });
});
