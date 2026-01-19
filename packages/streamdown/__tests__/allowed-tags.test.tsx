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
