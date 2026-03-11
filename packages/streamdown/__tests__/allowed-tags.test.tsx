import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import type { ExtraProps } from "../lib/markdown";

type CustomComponentProps = Record<string, unknown> & ExtraProps;

describe("allowedTags prop", () => {
  it("should render custom tags when allowedTags is provided", () => {
    const CustomTag = (props: CustomComponentProps) => (
      <span data-testid="custom-tag">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ custom: [] }}
        components={{ custom: CustomTag }}
        mode="static"
      >
        {"Hello <custom>world</custom>"}
      </Streamdown>
    );

    const customTag = container.querySelector('[data-testid="custom-tag"]');
    expect(customTag).toBeTruthy();
    expect(customTag?.textContent).toBe("world");
  });

  it("should preserve allowed attributes on custom tags", () => {
    const RefTag = (props: CustomComponentProps) => (
      <span data-note-id={props.note_id as string} data-testid="ref-tag">
        {props.children as React.ReactNode}
      </span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ ref: ["note_id"] }}
        components={{ ref: RefTag }}
        mode="static"
      >
        {'Check <ref note_id="123">this note</ref>'}
      </Streamdown>
    );

    const refTag = container.querySelector('[data-testid="ref-tag"]');
    expect(refTag).toBeTruthy();
    expect(refTag?.getAttribute("data-note-id")).toBe("123");
    expect(refTag?.textContent).toBe("this note");
  });

  it("should strip attributes not in allowedTags", () => {
    const CustomTag = (props: CustomComponentProps) => (
      <span
        data-allowed={props.allowed as string}
        data-blocked={props.blocked as string}
        data-testid="custom-tag"
      >
        {props.children as React.ReactNode}
      </span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ custom: ["allowed"] }}
        components={{ custom: CustomTag }}
        mode="static"
      >
        {'<custom allowed="yes" blocked="no">content</custom>'}
      </Streamdown>
    );

    const customTag = container.querySelector('[data-testid="custom-tag"]');
    expect(customTag).toBeTruthy();
    expect(customTag?.getAttribute("data-allowed")).toBe("yes");
    // blocked attribute should be stripped by sanitization
    expect(customTag?.getAttribute("data-blocked")).toBeNull();
  });

  it("should strip custom tags when allowedTags is not provided", () => {
    const CustomTag = (props: CustomComponentProps) => (
      <span data-testid="custom-tag">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown components={{ custom: CustomTag }} mode="static">
        {"Hello <custom>world</custom>"}
      </Streamdown>
    );

    // Custom tag should be stripped, but content preserved
    const customTag = container.querySelector('[data-testid="custom-tag"]');
    expect(customTag).toBeNull();
    // The text "world" should still appear (tags stripped, content kept)
    expect(container.textContent).toContain("world");
  });

  it("should not affect custom rehypePlugins", () => {
    const CustomTag = (props: CustomComponentProps) => (
      <span data-testid="custom-tag">{props.children as React.ReactNode}</span>
    );

    // When custom rehypePlugins are provided, allowedTags is ignored
    // (user is responsible for their own sanitization)
    const customPlugin = () => (tree: unknown) => tree;

    const { container } = render(
      <Streamdown
        allowedTags={{ custom: [] }}
        components={{ custom: CustomTag }}
        mode="static"
        rehypePlugins={[customPlugin]}
      >
        {"Hello <custom>world</custom>"}
      </Streamdown>
    );

    // With custom rehypePlugins (no sanitization), tag might or might not render
    // depending on how rehype-raw handles it - the key is allowedTags doesn't crash
    expect(container).toBeTruthy();
  });

  it("should work in streaming mode", () => {
    const RefTag = (props: CustomComponentProps) => (
      <span data-testid="ref-tag">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ ref: ["note_id"] }}
        components={{ ref: RefTag }}
        mode="streaming"
      >
        {'Hello <ref note_id="456">note</ref>'}
      </Streamdown>
    );

    const refTag = container.querySelector('[data-testid="ref-tag"]');
    expect(refTag).toBeTruthy();
    expect(refTag?.textContent).toBe("note");
  });

  it("should handle multiple custom tags", () => {
    const Tag1 = (props: CustomComponentProps) => (
      <span data-testid="tag1">{props.children as React.ReactNode}</span>
    );
    const Tag2 = (props: CustomComponentProps) => (
      <span data-testid="tag2">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ tag1: [], tag2: ["attr"] }}
        components={{ tag1: Tag1, tag2: Tag2 }}
        mode="static"
      >
        {'<tag1>first</tag1> and <tag2 attr="val">second</tag2>'}
      </Streamdown>
    );

    const tag1 = container.querySelector('[data-testid="tag1"]');
    const tag2 = container.querySelector('[data-testid="tag2"]');
    expect(tag1).toBeTruthy();
    expect(tag2).toBeTruthy();
    expect(tag1?.textContent).toBe("first");
    expect(tag2?.textContent).toBe("second");
  });

  it("should handle custom tags with blank lines in content", () => {
    const Snippet = (props: CustomComponentProps) => (
      <div data-testid={`snippet-${props.id}`}>
        {props.children as React.ReactNode}
      </div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ snippet: ["id", "file", "index"] }}
        components={{ snippet: Snippet }}
        mode="static"
      >
        {`<snippet id="1" file="test.txt" index="1">
Snippet 1

Some more content on a new line
</snippet>

<snippet id="2" file="test.txt" index="2">
Snippet 2

Content for snippet 2
</snippet>`}
      </Streamdown>
    );

    // rehype-sanitize prefixes id attributes with "user-content-"
    const snippet1 = container.querySelector(
      '[data-testid="snippet-user-content-1"]'
    );
    const snippet2 = container.querySelector(
      '[data-testid="snippet-user-content-2"]'
    );
    expect(snippet1).toBeTruthy();
    expect(snippet2).toBeTruthy();
    // Ensure snippet 2's content isn't absorbed into snippet 1
    expect(snippet1?.textContent).not.toContain("Snippet 2");
    expect(snippet2?.textContent).toContain("Snippet 2");
  });

  it("should handle empty allowedTags object", () => {
    const { container } = render(
      <Streamdown allowedTags={{}} mode="static">
        {"Hello world"}
      </Streamdown>
    );

    // Should render normally without errors
    expect(container.textContent).toContain("Hello world");
  });
});

describe("literalTagContent prop", () => {
  it("should render underscore content as plain text (not emphasis)", () => {
    const Mention = (props: CustomComponentProps) => (
      <span data-testid="mention">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ mention: ["user_id"] }}
        components={{ mention: Mention }}
        literalTagContent={["mention"]}
        mode="static"
      >
        {'<mention user_id="123">_some_username_</mention>'}
      </Streamdown>
    );

    const mention = container.querySelector('[data-testid="mention"]');
    expect(mention).toBeTruthy();
    // Children should be plain text, not an <em> element
    expect(mention?.querySelector("em")).toBeNull();
    expect(mention?.textContent).toBe("_some_username_");
  });

  it("should only apply literal mode to the specified tags", () => {
    const Mention = (props: CustomComponentProps) => (
      <span data-testid="mention">{props.children as React.ReactNode}</span>
    );
    const Note = (props: CustomComponentProps) => (
      <span data-testid="note">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ mention: [], note: [] }}
        components={{ mention: Mention, note: Note }}
        literalTagContent={["mention"]}
        mode="static"
      >
        {"<mention>_literal_</mention> <note>_parsed_</note>"}
      </Streamdown>
    );

    const mention = container.querySelector('[data-testid="mention"]');
    const note = container.querySelector('[data-testid="note"]');

    // mention: no emphasis, raw underscores
    expect(mention?.querySelector("em")).toBeNull();
    expect(mention?.textContent).toBe("_literal_");

    // note: emphasis IS parsed (not in literalTagContent)
    expect(note?.querySelector("em")).toBeTruthy();
  });

  it("should render bold, inline code and other markdown as plain text", () => {
    const Tag = (props: CustomComponentProps) => (
      <span data-testid="tag">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ tag: [] }}
        components={{ tag: Tag }}
        literalTagContent={["tag"]}
        mode="static"
      >
        {"<tag>**bold** and `code`</tag>"}
      </Streamdown>
    );

    const tag = container.querySelector('[data-testid="tag"]');
    expect(tag?.querySelector("strong")).toBeNull();
    expect(tag?.querySelector("code")).toBeNull();
    expect(tag?.textContent).toContain("**bold**");
    expect(tag?.textContent).toContain("`code`");
  });

  it("should have no effect when literalTagContent is an empty array", () => {
    const Mention = (props: CustomComponentProps) => (
      <span data-testid="mention">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ mention: [] }}
        components={{ mention: Mention }}
        literalTagContent={[]}
        mode="static"
      >
        {"<mention>_parsed_</mention>"}
      </Streamdown>
    );

    const mention = container.querySelector('[data-testid="mention"]');
    // Markdown IS still parsed (empty literalTagContent = no effect)
    expect(mention?.querySelector("em")).toBeTruthy();
  });

  it("should work in streaming mode", () => {
    const Mention = (props: CustomComponentProps) => (
      <span data-testid="mention">{props.children as React.ReactNode}</span>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ mention: ["user_id"] }}
        components={{ mention: Mention }}
        literalTagContent={["mention"]}
        mode="streaming"
      >
        {'Hello <mention user_id="42">_handle_</mention>'}
      </Streamdown>
    );

    const mention = container.querySelector('[data-testid="mention"]');
    expect(mention).toBeTruthy();
    expect(mention?.querySelector("em")).toBeNull();
    expect(mention?.textContent).toBe("_handle_");
  });
  it("should render entire content when literalTagContent tag has double newlines", () => {
    const AiThinking = (props: CustomComponentProps) => (
      <div data-testid="ai-thinking">{props.children as React.ReactNode}</div>
    );

    const { container } = render(
      <Streamdown
        allowedTags={{ "ai-thinking": [] }}
        components={{ "ai-thinking": AiThinking }}
        literalTagContent={["ai-thinking"]}
        mode="static"
      >
        {"<ai-thinking>first part\n\nsecond part</ai-thinking>"}
      </Streamdown>
    );

    const el = container.querySelector("[data-testid=\"ai-thinking\"]");
    expect(el).toBeTruthy();
    expect(el?.textContent).toContain("first part");
    expect(el?.textContent).toContain("second part");
  });

});
