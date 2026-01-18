import { render, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("Code block hydration error fix", () => {
  it("should not wrap code blocks in <p> tags to prevent hydration errors", async () => {
    const markdown = `Here is some text.

\`\`\`typescript
const foo = "bar";
\`\`\`

More text after.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Wait for the code block to render (it's lazily loaded)
    await waitFor(
      () => {
        const codeBlockWrapper = container.querySelector(
          '[data-streamdown="code-block"]'
        );
        expect(codeBlockWrapper).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Find the code block wrapper div
    const codeBlockWrapper = container.querySelector(
      '[data-streamdown="code-block"]'
    );
    expect(codeBlockWrapper?.tagName).toBe("DIV");

    // Ensure the code block wrapper is NOT inside a <p> tag
    const parentElement = codeBlockWrapper?.parentElement;
    expect(parentElement?.tagName).not.toBe("P");
  });

  it("should render inline code correctly inside paragraphs", () => {
    const markdown = "This is a paragraph with `inline code` in it.";

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Find the inline code
    const inlineCode = container.querySelector(
      '[data-streamdown="inline-code"]'
    );
    expect(inlineCode).toBeTruthy();
    expect(inlineCode?.tagName).toBe("CODE");

    // Inline code SHOULD be inside a <p> tag
    const paragraph = container.querySelector("p");
    expect(paragraph).toBeTruthy();
    expect(paragraph?.contains(inlineCode)).toBe(true);
  });

  it("should handle multiple code blocks", async () => {
    const markdown = `First code block:

\`\`\`javascript
const a = 1;
\`\`\`

Second code block:

\`\`\`python
x = 2
\`\`\``;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Wait for the code blocks to render (they're lazily loaded)
    await waitFor(
      () => {
        const codeBlockWrappers = container.querySelectorAll(
          '[data-streamdown="code-block"]'
        );
        expect(codeBlockWrappers.length).toBe(2);
      },
      { timeout: 5000 }
    );

    // Find all code block wrappers
    const codeBlockWrappers = container.querySelectorAll(
      '[data-streamdown="code-block"]'
    );

    // Ensure no code block wrapper is inside a <p> tag
    for (const wrapper of codeBlockWrappers) {
      const parentElement = wrapper.parentElement;
      expect(parentElement?.tagName).not.toBe("P");
    }
  });

  it("should handle code blocks mixed with images", async () => {
    const markdown = `Some text.

![Image](https://example.com/image.png)

\`\`\`typescript
const x = 1;
\`\`\`

More text.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Wait for the code block to render (it's lazily loaded)
    await waitFor(
      () => {
        const codeBlockWrapper = container.querySelector(
          '[data-streamdown="code-block"]'
        );
        expect(codeBlockWrapper).toBeTruthy();
      },
      { timeout: 5000 }
    );

    // Neither image nor code block should be in <p> tags
    const imageWrapper = container.querySelector(
      '[data-streamdown="image-wrapper"]'
    );
    const codeBlockWrapper = container.querySelector(
      '[data-streamdown="code-block"]'
    );

    expect(imageWrapper).toBeTruthy();
    expect(codeBlockWrapper).toBeTruthy();

    expect(imageWrapper?.parentElement?.tagName).not.toBe("P");
    expect(codeBlockWrapper?.parentElement?.tagName).not.toBe("P");
  });
});
