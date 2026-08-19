import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { parseMarkdownIntoBlocks, Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type CustomComponentProps = Record<string, unknown> & ExtraProps;

const AiThinking = (props: CustomComponentProps) => (
  <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
);

const Snippet = (props: CustomComponentProps) => (
  <div data-testid={`snippet-${props.id}`}>
    {props.children as React.ReactNode}
  </div>
);

describe("markdown inside custom tags (blank lines / block containers)", () => {
  it("parses bold on the same line as the opening tag", () => {
    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>**bold**</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelector('[data-streamdown="strong"]')?.textContent).toBe(
      "bold"
    );
  });

  it("parses bold when content starts on the next line", () => {
    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>\n**bold**</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelector('[data-streamdown="strong"]')?.textContent).toBe(
      "bold"
    );
    expect(el?.textContent).not.toContain("**");
  });

  it("parses bold when content is on its own lines", () => {
    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {"<ai-thinking>\n**bold**\n</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelector('[data-streamdown="strong"]')?.textContent).toBe(
      "bold"
    );
  });

  it("parses lists and emphasis across blank lines inside the tag", () => {
    const md = `<ai-thinking>

**bold** and more

- list item
- **bold item**

</ai-thinking>

# Outside`;

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        mode="static"
      >
        {md}
      </Streamdown>
    );

    const el = container.querySelector('[data-testid="ai-thinking"]');
    expect(el).toBeTruthy();
    expect(el?.querySelectorAll('[data-streamdown="strong"]').length).toBe(2);
    expect(el?.querySelector("ul")).toBeTruthy();
    expect(
      container.querySelector('[data-streamdown="heading-1"]')?.textContent
    ).toBe("Outside");
  });

  it("keeps multi-snippet blank-line content in separate components", () => {
    const md = `<snippet id="1" file="test.txt" index="1">
Snippet 1

Some more content on a new line
</snippet>

<snippet id="2" file="test.txt" index="2">
Snippet 2

Content for snippet 2
</snippet>`;

    const { container } = render(
      <Streamdown
        allowedTags={{ snippet: ["id", "file", "index"] }}
        components={{ snippet: Snippet }}
        mode="static"
      >
        {md}
      </Streamdown>
    );

    const snippet1 = container.querySelector('[data-testid="snippet-1"]');
    const snippet2 = container.querySelector('[data-testid="snippet-2"]');
    expect(snippet1).toBeTruthy();
    expect(snippet2).toBeTruthy();
    expect(snippet1?.textContent).not.toContain("Snippet 2");
    expect(snippet2?.textContent).toContain("Snippet 2");
  });

  it("merges hyphenated custom tags across blank lines in parseMarkdownIntoBlocks", () => {
    const md = `<ai-thinking>

**bold**

</ai-thinking>

# Outside`;

    const blocks = parseMarkdownIntoBlocks(md);
    expect(blocks.length).toBe(2);
    expect(blocks[0]).toContain("<ai-thinking>");
    expect(blocks[0]).toContain("**bold**");
    expect(blocks[0]).toContain("</ai-thinking>");
    expect(blocks[1]).toContain("# Outside");
  });
});
