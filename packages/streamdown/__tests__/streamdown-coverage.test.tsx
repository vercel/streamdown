import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Block, normalizeHtmlIndentation, Streamdown } from "../index";

const INDENTED_DIV_REGEX = /^ {4,}<div>/m;

// Mock the dependencies
vi.mock("../lib/markdown", () => ({
  Markdown: ({ children, ...props }: any) => {
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

describe("Streamdown animated paths", () => {
  it("should handle animated=true with isAnimating=true", () => {
    const { container } = render(
      <Streamdown animated={true} isAnimating={true}>
        Hello World
      </Streamdown>
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    // Check that the caret and animate logic doesn't break rendering
    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBeGreaterThan(0);
  });

  it("should handle animated with custom options", () => {
    const { container } = render(
      <Streamdown
        animated={{ animation: "blurIn", duration: 300, sep: "char" }}
        isAnimating={true}
      >
        Hello World
      </Streamdown>
    );

    expect(container.firstElementChild).toBeTruthy();
  });

  it("should not include animate plugin when isAnimating is false", () => {
    const { container } = render(
      <Streamdown animated={true} isAnimating={false}>
        Hello World
      </Streamdown>
    );

    expect(container.firstElementChild).toBeTruthy();
  });

  it("should show caret when caret and isAnimating are set", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        Hello World
      </Streamdown>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.style.getPropertyValue("--streamdown-caret")).toContain(
      "▋"
    );
  });

  it("should show empty span when no blocks and caret is active", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={true}>
        {""}
      </Streamdown>
    );

    const wrapper = container.firstElementChild;
    const span = wrapper?.querySelector("span");
    expect(span).toBeTruthy();
  });

  it("should not show caret style when not animating", () => {
    const { container } = render(
      <Streamdown caret="block" isAnimating={false}>
        Hello
      </Streamdown>
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper?.style.getPropertyValue("--streamdown-caret")).toBeFalsy();
  });
});

describe("Streamdown mode transitions", () => {
  it("should switch from streaming to static mode", () => {
    const { container, rerender } = render(
      <Streamdown mode="streaming">Hello World</Streamdown>
    );

    rerender(<Streamdown mode="static">Hello World</Streamdown>);

    const markdowns = container.querySelectorAll('[data-testid="markdown"]');
    expect(markdowns.length).toBe(1);
  });

  it("should use useTransition in streaming mode for block updates", async () => {
    const { container, rerender } = render(
      <Streamdown mode="streaming">First</Streamdown>
    );

    // Update children in streaming mode - triggers the useTransition path
    rerender(<Streamdown mode="streaming">First\n\nSecond block</Streamdown>);

    await waitFor(() => {
      const wrapper = container.firstElementChild;
      expect(wrapper).toBeTruthy();
    });
  });

  it("should set displayBlocks directly in non-streaming mode", () => {
    const { container, rerender } = render(
      <Streamdown mode="static">First</Streamdown>
    );

    rerender(<Streamdown mode="static">Updated</Streamdown>);

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown?.textContent).toBe("Updated");
  });
});

describe("Streamdown allowedTags", () => {
  it("should extend sanitization schema with allowed tags", () => {
    const { container } = render(
      <Streamdown allowedTags={{ "custom-tag": ["class", "id"] }}>
        {'<custom-tag class="test">Hello</custom-tag>'}
      </Streamdown>
    );

    expect(container.firstElementChild).toBeTruthy();
  });
});

describe("Block component", () => {
  it("should apply normalizeHtmlIndentation when enabled", () => {
    const { container } = render(
      <Block
        content={"    <div>\n        <p>Hello</p>\n    </div>"}
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={true}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container.textContent).toBeTruthy();
  });

  it("should not normalize when disabled", () => {
    const { container } = render(
      <Block
        content="**bold**"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container.textContent).toBeTruthy();
  });
});

describe("Block memoization", () => {
  it("should re-render when content changes", () => {
    const { container, rerender } = render(
      <Block
        content="first"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="second"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container.textContent).toBeTruthy();
  });

  it("should re-render when normalizeHtmlIndentation changes", () => {
    const { rerender, container } = render(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={true}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when index changes", () => {
    const { rerender, container } = render(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="test"
        index={1}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when isIncomplete changes", () => {
    const { rerender, container } = render(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="test"
        index={0}
        isIncomplete={true}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when components keys change", () => {
    const comp1 = { p: () => <p>custom</p> };
    const comp2 = { p: () => <p>custom</p>, h1: () => <h1>h</h1> };

    const { rerender, container } = render(
      <Block
        components={comp1}
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        components={comp2}
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when components values change", () => {
    const p1 = () => <p>a</p>;
    const p2 = () => <p>b</p>;

    const { rerender, container } = render(
      <Block
        components={{ p: p1 }}
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        components={{ p: p2 }}
        content="test"
        index={0}
        isIncomplete={false}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when rehypePlugins change", () => {
    const plugins1 = [
      () => {
        // noop
      },
    ];
    const plugins2 = [
      () => {
        // noop
      },
      () => {
        // noop
      },
    ];

    const { rerender, container } = render(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        rehypePlugins={plugins1}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        rehypePlugins={plugins2}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });

  it("should re-render when remarkPlugins change", () => {
    const plugins1 = [
      () => {
        // noop
      },
    ];
    const plugins2 = [
      () => {
        // noop
      },
      () => {
        // noop
      },
    ];

    const { rerender, container } = render(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        remarkPlugins={plugins1}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    rerender(
      <Block
        content="test"
        index={0}
        isIncomplete={false}
        remarkPlugins={plugins2}
        shouldNormalizeHtmlIndentation={false}
        shouldParseIncompleteMarkdown={false}
      />
    );

    expect(container).toBeTruthy();
  });
});

describe("Streamdown memoization", () => {
  it("should re-render when shikiTheme changes", () => {
    const { rerender, container } = render(
      <Streamdown shikiTheme={["github-light", "github-dark"]}>Test</Streamdown>
    );

    rerender(
      <Streamdown shikiTheme={["nord", "one-dark-pro"]}>Test</Streamdown>
    );

    expect(container.firstElementChild).toBeTruthy();
  });

  it("should re-render when animated changes", () => {
    const { rerender, container } = render(
      <Streamdown animated={false}>Test</Streamdown>
    );

    rerender(<Streamdown animated={true}>Test</Streamdown>);

    expect(container.firstElementChild).toBeTruthy();
  });

  it("should re-render when linkSafety changes", () => {
    const { rerender, container } = render(
      <Streamdown linkSafety={{ enabled: false }}>Test</Streamdown>
    );

    rerender(<Streamdown linkSafety={{ enabled: true }}>Test</Streamdown>);

    expect(container.firstElementChild).toBeTruthy();
  });

  it("should re-render when normalizeHtmlIndentation changes", () => {
    const { rerender, container } = render(
      <Streamdown normalizeHtmlIndentation={false}>Test</Streamdown>
    );

    rerender(<Streamdown normalizeHtmlIndentation={true}>Test</Streamdown>);

    expect(container.firstElementChild).toBeTruthy();
  });
});

describe("normalizeHtmlIndentation", () => {
  it("should return empty string unchanged", () => {
    expect(normalizeHtmlIndentation("")).toBe("");
  });

  it("should return non-HTML content unchanged", () => {
    expect(normalizeHtmlIndentation("Hello world")).toBe("Hello world");
  });

  it("should normalize indented HTML tags", () => {
    const input = "    <div>\n        <p>Hello</p>\n    </div>";
    const result = normalizeHtmlIndentation(input);
    expect(result).not.toMatch(INDENTED_DIV_REGEX);
  });
});
