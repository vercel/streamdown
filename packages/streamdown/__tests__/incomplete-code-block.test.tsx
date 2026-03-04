import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { Block, Streamdown, useIsCodeFenceIncomplete } from "../index";
import { hasIncompleteCodeFence, hasTable } from "../lib/incomplete-code-utils";
import type { ExtraProps } from "../lib/markdown";

describe("hasIncompleteCodeFence utility", () => {
  it("should return true for incomplete backtick code fence", () => {
    expect(hasIncompleteCodeFence("```javascript\nconst x = 1;")).toBe(true);
    expect(hasIncompleteCodeFence("```\ncode here")).toBe(true);
    expect(hasIncompleteCodeFence("Some text\n```python\ndef hello():")).toBe(
      true
    );
  });

  it("should return true for incomplete tilde code fence", () => {
    expect(hasIncompleteCodeFence("~~~javascript\nconst x = 1;")).toBe(true);
    expect(hasIncompleteCodeFence("~~~\ncode here")).toBe(true);
    expect(hasIncompleteCodeFence("Some text\n~~~python\ndef hello():")).toBe(
      true
    );
  });

  it("should return false for complete backtick code fence", () => {
    expect(hasIncompleteCodeFence("```javascript\nconst x = 1;\n```")).toBe(
      false
    );
    expect(hasIncompleteCodeFence("```\ncode\n```")).toBe(false);
    expect(hasIncompleteCodeFence("No code fence here")).toBe(false);
  });

  it("should return false for complete tilde code fence", () => {
    expect(hasIncompleteCodeFence("~~~javascript\nconst x = 1;\n~~~")).toBe(
      false
    );
    expect(hasIncompleteCodeFence("~~~\ncode\n~~~")).toBe(false);
  });

  it("should return false for multiple complete code blocks", () => {
    const markdown = "```js\ncode1\n```\n\n```python\ncode2\n```";
    expect(hasIncompleteCodeFence(markdown)).toBe(false);
  });

  it("should return false for multiple complete tilde code blocks", () => {
    const markdown = "~~~js\ncode1\n~~~\n\n~~~python\ncode2\n~~~";
    expect(hasIncompleteCodeFence(markdown)).toBe(false);
  });

  it("should return true for one complete and one incomplete code block", () => {
    const markdown = "```js\ncode1\n```\n\n```python\ncode2";
    expect(hasIncompleteCodeFence(markdown)).toBe(true);
  });

  it("should return true for mixed fences with incomplete tilde", () => {
    const markdown = "```js\ncode1\n```\n\n~~~python\ncode2";
    expect(hasIncompleteCodeFence(markdown)).toBe(true);
  });

  it("should handle mixed complete fences", () => {
    const markdown = "```js\ncode1\n```\n\n~~~python\ncode2\n~~~";
    expect(hasIncompleteCodeFence(markdown)).toBe(false);
  });

  it("should handle 6+ backtick fences correctly", () => {
    // A 6-backtick opening fence requires a 6+ backtick closing fence
    expect(hasIncompleteCodeFence("``````\ncode here")).toBe(true);
    expect(hasIncompleteCodeFence("``````\ncode\n``````")).toBe(false);
    // 3 backticks cannot close a 6-backtick fence
    expect(hasIncompleteCodeFence("``````\ncode\n```")).toBe(true);
  });

  it("should handle 4+ backtick fences correctly", () => {
    expect(hasIncompleteCodeFence("````\ncode")).toBe(true);
    expect(hasIncompleteCodeFence("````\ncode\n````")).toBe(false);
    // Closing fence can be longer than opening
    expect(hasIncompleteCodeFence("````\ncode\n`````")).toBe(false);
    // 3 backticks cannot close a 4-backtick fence
    expect(hasIncompleteCodeFence("````\ncode\n```")).toBe(true);
  });

  it("should not false-positive on inline backticks in prose", () => {
    // Triple backticks in the middle of a line are not code fences
    expect(hasIncompleteCodeFence("Use ``` to start a code fence")).toBe(false);
    expect(hasIncompleteCodeFence("The syntax is ``` for code blocks")).toBe(
      false
    );
  });

  it("should allow up to 3 spaces of indentation for fences", () => {
    expect(hasIncompleteCodeFence("   ```\ncode")).toBe(true);
    expect(hasIncompleteCodeFence("   ```\ncode\n   ```")).toBe(false);
    // 4+ spaces of indentation is NOT a fence (it's an indented code block)
    expect(hasIncompleteCodeFence("    ```\ncode")).toBe(false);
  });

  it("should require same character for closing fence", () => {
    // Opening with backticks, closing with tildes should not close
    expect(hasIncompleteCodeFence("```\ncode\n~~~")).toBe(true);
    // Opening with tildes, closing with backticks should not close
    expect(hasIncompleteCodeFence("~~~\ncode\n```")).toBe(true);
  });
});

describe("hasTable utility", () => {
  it("should detect a basic GFM table", () => {
    expect(hasTable("| Name | Age |\n| --- | --- |\n| Alice | 30 |")).toBe(
      true
    );
  });

  it("should detect a table with alignment markers", () => {
    expect(hasTable("| Left | Center | Right |\n| :--- | :---: | ---: |")).toBe(
      true
    );
  });

  it("should detect a table with only delimiter row streamed", () => {
    expect(hasTable("| Header |\n| --- |")).toBe(true);
  });

  it("should detect a table without leading pipes", () => {
    expect(hasTable("Name | Age\n--- | ---\nAlice | 30")).toBe(true);
  });

  it("should return false for regular text", () => {
    expect(hasTable("Just some regular text")).toBe(false);
  });

  it("should return false for a heading with dashes", () => {
    expect(hasTable("# My Heading\n\nSome text")).toBe(false);
  });

  it("should return false for a horizontal rule", () => {
    expect(hasTable("Some text\n\n---\n\nMore text")).toBe(false);
  });

  it("should return false for empty string", () => {
    expect(hasTable("")).toBe(false);
  });

  it("should detect table in mixed content", () => {
    expect(hasTable("Some intro text\n\n| Col |\n| --- |\n| Val |")).toBe(true);
  });
});

describe("useIsCodeFenceIncomplete hook", () => {
  it("should return true when streaming with incomplete code fence", () => {
    let capturedValue: boolean | null = null;

    const ContextCapture = (props: ExtraProps & { children?: ReactNode }) => {
      capturedValue = useIsCodeFenceIncomplete();
      return <code>{props.children}</code>;
    };

    render(
      <Streamdown
        components={{
          code: ContextCapture,
        }}
        isAnimating={true}
      >
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    expect(capturedValue).toBe(true);
  });

  it("should return false when code fence is complete", () => {
    let capturedValue: boolean | null = null;

    const ContextCapture = (_props: ExtraProps & { children?: ReactNode }) => {
      capturedValue = useIsCodeFenceIncomplete();
      return null;
    };

    render(
      <Streamdown
        components={{
          p: ContextCapture,
        }}
        isAnimating={true}
      >
        {"```javascript\nconst x = 1;\n```\n\nSome text"}
      </Streamdown>
    );

    // Last block has no incomplete code fence
    expect(capturedValue).toBe(false);
  });

  it("should return false when not streaming", () => {
    let capturedValue: boolean | null = null;

    const ContextCapture = (props: ExtraProps & { children?: ReactNode }) => {
      capturedValue = useIsCodeFenceIncomplete();
      return <code>{props.children}</code>;
    };

    render(
      <Streamdown
        components={{
          code: ContextCapture,
        }}
        isAnimating={false}
      >
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    expect(capturedValue).toBe(false);
  });
});

describe("incomplete code block detection", () => {
  it("should mark code block as incomplete when streaming with unclosed fence", async () => {
    const { container } = render(
      <Streamdown isAnimating={true}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    // Wait for lazy-loaded CodeBlock to render
    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).not.toBeNull();
    });

    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    expect(codeBlock?.getAttribute("data-incomplete")).toBe("true");
  });

  it("should not mark code block as incomplete when fence is closed", async () => {
    const { container } = render(
      <Streamdown isAnimating={true}>
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>
    );

    // Wait for lazy-loaded CodeBlock to render
    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).not.toBeNull();
    });

    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    // data-incomplete should not be present (or be undefined/null)
    expect(codeBlock?.getAttribute("data-incomplete")).toBeNull();
  });

  it("should not mark code block as incomplete when not streaming", async () => {
    const { container } = render(
      <Streamdown isAnimating={false}>
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    // Wait for lazy-loaded CodeBlock to render
    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).not.toBeNull();
    });

    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    expect(codeBlock?.getAttribute("data-incomplete")).toBeNull();
  });

  it("should not mark code block as incomplete in static mode", async () => {
    const { container } = render(
      <Streamdown isAnimating={true} mode="static">
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    // Wait for lazy-loaded CodeBlock to render
    await waitFor(() => {
      const codeBlock = container.querySelector(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlock).not.toBeNull();
    });

    const codeBlock = container.querySelector('[data-streamdown="code-block"]');
    expect(codeBlock?.getAttribute("data-incomplete")).toBeNull();
  });

  it("should only mark last block's code as incomplete, not earlier blocks", async () => {
    const markdown = `\`\`\`python
def complete():
    pass
\`\`\`

Some text here

\`\`\`javascript
const incomplete`;

    const { container } = render(
      <Streamdown isAnimating={true}>{markdown}</Streamdown>
    );

    // Wait for lazy-loaded CodeBlocks to render
    await waitFor(() => {
      const codeBlocks = container.querySelectorAll(
        '[data-streamdown="code-block"]'
      );
      expect(codeBlocks.length).toBe(2);
    });

    const codeBlocks = container.querySelectorAll(
      '[data-streamdown="code-block"]'
    );

    // First code block should not be marked incomplete (it's complete and not last)
    expect(codeBlocks[0].getAttribute("data-incomplete")).toBeNull();

    // Second code block should be marked incomplete
    expect(codeBlocks[1].getAttribute("data-incomplete")).toBe("true");
  });
});

describe("custom component access to useIsCodeFenceIncomplete", () => {
  it("should allow custom code component to use useIsCodeFenceIncomplete", async () => {
    let capturedValue: boolean | null = null;

    const CustomCode = (props: ExtraProps & { children?: ReactNode }) => {
      capturedValue = useIsCodeFenceIncomplete();

      if (capturedValue) {
        return <div data-testid="loading">Loading code...</div>;
      }

      return <code>{props.children}</code>;
    };

    render(
      <Streamdown
        components={{
          code: CustomCode,
        }}
        isAnimating={true}
      >
        {"```javascript\nconst x = 1;"}
      </Streamdown>
    );

    // Wait for custom component to render
    await waitFor(() => {
      expect(capturedValue).not.toBeNull();
    });

    expect(capturedValue).toBe(true);

    // Custom component should have rendered the loading state
    expect(screen.getByTestId("loading")).toBeTruthy();
  });

  it("should return false for complete code", async () => {
    let capturedValue: boolean | null = null;

    const CustomCode = (props: ExtraProps & { children?: ReactNode }) => {
      capturedValue = useIsCodeFenceIncomplete();
      return <code>{props.children}</code>;
    };

    render(
      <Streamdown
        components={{
          code: CustomCode,
        }}
        isAnimating={true}
      >
        {"```javascript\nconst x = 1;\n```"}
      </Streamdown>
    );

    // Wait for custom component to render
    await waitFor(() => {
      expect(capturedValue).not.toBeNull();
    });

    expect(capturedValue).toBe(false);
  });
});

describe("Block component exports", () => {
  it("should export Block component", () => {
    expect(Block).toBeDefined();
    expect(typeof Block).toBe("object"); // memo returns an object
  });

  it("should export useIsCodeFenceIncomplete hook", () => {
    expect(useIsCodeFenceIncomplete).toBeDefined();
    expect(typeof useIsCodeFenceIncomplete).toBe("function");
  });
});
