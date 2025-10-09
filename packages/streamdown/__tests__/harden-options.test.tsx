import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

// Mock the dependencies
vi.mock("react-markdown", () => ({
  default: ({ children, rehypePlugins, ...props }: any) => {
    if (!children) {
      return null;
    }
    // Store rehypePlugins in a data attribute for testing
    return (
      <div
        data-testid="markdown"
        data-rehype-plugins={JSON.stringify(
          rehypePlugins?.map((plugin: any) => {
            if (Array.isArray(plugin)) {
              return {
                name: plugin[0]?.name || "unknown",
                options: plugin[1],
              };
            }
            return { name: plugin?.name || "unknown" };
          })
        )}
        {...props}
      >
        {children}
      </div>
    );
  },
}));

vi.mock("rehype-katex", () => ({
  default: () => {},
}));

vi.mock("remark-gfm", () => ({
  default: () => {},
}));

vi.mock("remark-math", () => ({
  default: () => {},
}));

vi.mock("rehype-harden", () => ({
  harden: vi.fn((options) => {
    const fn = () => {};
    Object.assign(fn, { options });
    return fn;
  }),
}));

describe("Streamdown hardenOptions", () => {
  it("should use default hardenOptions when not specified", () => {
    const { container } = render(<Streamdown>Test content</Streamdown>);
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();

    const rehypePlugins = JSON.parse(
      markdown?.getAttribute("data-rehype-plugins") || "[]"
    );
    expect(rehypePlugins).toBeDefined();
  });

  it("should accept custom hardenOptions", () => {
    const customOptions = {
      allowedImagePrefixes: ["https://example.com"],
      allowedLinkPrefixes: ["https://example.com", "mailto:"],
      defaultOrigin: "https://example.com",
    };

    const { container } = render(
      <Streamdown hardenOptions={customOptions}>Test content</Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept partial hardenOptions", () => {
    const partialOptions = {
      allowedLinkPrefixes: ["https://trusted.com"],
    };

    const { container } = render(
      <Streamdown hardenOptions={partialOptions}>Test content</Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept empty array for allowedImagePrefixes to block all images", () => {
    const strictOptions = {
      allowedImagePrefixes: [],
      allowedLinkPrefixes: ["*"],
    };

    const { container } = render(
      <Streamdown hardenOptions={strictOptions}>
        ![Image](https://example.com/image.png)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept empty array for allowedLinkPrefixes to block all links", () => {
    const strictOptions = {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: [],
    };

    const { container } = render(
      <Streamdown hardenOptions={strictOptions}>
        [Link](https://example.com)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept wildcard for allowedImagePrefixes", () => {
    const wildcardOptions = {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["https://"],
    };

    const { container } = render(
      <Streamdown hardenOptions={wildcardOptions}>
        ![Image](https://example.com/image.png)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept multiple prefixes for allowedImagePrefixes", () => {
    const multiPrefixOptions = {
      allowedImagePrefixes: [
        "https://cdn.example.com",
        "https://images.example.com",
        "data:",
      ],
      allowedLinkPrefixes: ["*"],
    };

    const { container } = render(
      <Streamdown hardenOptions={multiPrefixOptions}>
        ![Image](https://cdn.example.com/image.png)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept multiple prefixes for allowedLinkPrefixes", () => {
    const multiPrefixOptions = {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: [
        "https://example.com",
        "https://trusted.com",
        "mailto:",
        "tel:",
      ],
    };

    const { container } = render(
      <Streamdown hardenOptions={multiPrefixOptions}>
        [Link](https://example.com)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should accept defaultOrigin for relative URLs", () => {
    const originOptions = {
      allowedImagePrefixes: ["*"],
      allowedLinkPrefixes: ["*"],
      defaultOrigin: "https://example.com",
    };

    const { container } = render(
      <Streamdown hardenOptions={originOptions}>
        [Relative Link](/path/to/page)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should work with hardenOptions and other props together", () => {
    const customOptions = {
      allowedImagePrefixes: ["https://"],
      allowedLinkPrefixes: ["https://", "mailto:"],
      defaultOrigin: "https://example.com",
    };

    const { container } = render(
      <Streamdown
        hardenOptions={customOptions}
        className="custom-class"
        parseIncompleteMarkdown={true}
      >
        # Test Content
      </Streamdown>
    );

    const wrapper = container.firstElementChild;
    expect(wrapper).toBeTruthy();
    expect(wrapper?.getAttribute("class")).toContain("custom-class");

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });

  it("should handle hardenOptions with special protocol prefixes", () => {
    const specialProtocolOptions = {
      allowedImagePrefixes: ["data:", "blob:", "https://"],
      allowedLinkPrefixes: ["https://", "http://", "mailto:", "tel:", "#"],
    };

    const { container } = render(
      <Streamdown hardenOptions={specialProtocolOptions}>
        ![Data URI](data:image/png;base64,abc123)
        [Email](mailto:test@example.com)
        [Phone](tel:+1234567890)
        [Anchor](#section)
      </Streamdown>
    );
    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
  });
});
