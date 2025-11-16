import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

// Mock the dependencies
vi.mock("react-markdown", () => ({
  default: ({
    children,
    allowedImagePrefixes,
    allowedLinkPrefixes,
    defaultOrigin,
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

describe("Email Addresses (#160)", () => {
  it("should render email addresses without blocking them", () => {
    const email = "example@gmail.com";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{email}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });

  it("should handle email addresses in sentences", () => {
    const content = "Please contact me at john.doe@example.com for more info";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(content);
  });

  it("should handle multiple email addresses", () => {
    const content = "Contact admin@site.com or support@site.com";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{content}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(content);
  });

  it("should handle email addresses with special characters", () => {
    const email = "user+test@example-domain.co.uk";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={true}>{email}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });

  it("should handle email addresses with parseIncompleteMarkdown disabled", () => {
    const email = "example@gmail.com";
    const { container } = render(
      <Streamdown parseIncompleteMarkdown={false}>{email}</Streamdown>
    );

    const markdown = container.querySelector('[data-testid="markdown"]');
    expect(markdown).toBeTruthy();
    expect(markdown?.textContent).toBe(email);
  });
});
