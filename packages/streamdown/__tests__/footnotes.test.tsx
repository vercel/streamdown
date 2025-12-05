import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("Footnotes", () => {
  it("should render footnote references and definitions correctly", () => {
    const markdown = `Here is a simple footnote[^1].

A footnote can also have multiple lines[^2].

[^1]: This is the first footnote.
[^2]: This is a multi-line footnote.
    It can have multiple paragraphs.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Check that footnote reference superscripts exist
    const footnoteRefs = container.querySelectorAll(
      'sup[data-streamdown="superscript"]'
    );
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(2);

    // Check that the footnote definition section exists
    const footnoteDef = container.querySelector("section[data-footnotes]");
    expect(footnoteDef).toBeTruthy();

    // Check that footnote list items exist
    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 2).toBe(true);

    // Check that footnote text is present
    expect(container.innerHTML).toContain("This is the first footnote");
    expect(container.innerHTML).toContain("This is a multi-line footnote");
  });

  it("should handle multiple footnote references", () => {
    const markdown = `First reference[^1], second reference[^2], and third[^3].

[^1]: First note.
[^2]: Second note.
[^3]: Third note.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Check that all three footnote references exist
    const footnoteRefs = container.querySelectorAll(
      'sup[data-streamdown="superscript"]'
    );
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(3);

    // Check that the footnote section exists
    const footnoteDef = container.querySelector("section[data-footnotes]");
    expect(footnoteDef).toBeTruthy();

    // Check that all three footnote definitions exist
    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 3).toBe(true);
  });

  it("should handle footnotes with alphanumeric labels", () => {
    const markdown = `Reference with label[^note1].

[^note1]: This is a labeled footnote.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Check that the footnote reference exists
    const footnoteRef = container.querySelector(
      'sup[data-streamdown="superscript"]'
    );
    expect(footnoteRef).toBeTruthy();

    // Check that the footnote definition section exists
    const footnoteDef = container.querySelector("section[data-footnotes]");
    expect(footnoteDef).toBeTruthy();

    // Check that the footnote definition exists
    const footnoteListItems = footnoteDef?.querySelectorAll("li");
    expect(footnoteListItems && footnoteListItems.length >= 1).toBe(true);
    expect(container.innerHTML).toContain("This is a labeled footnote");
  });

  it("should render complex markdown with tables and footnotes", () => {
    const markdown = `# GitHub Flavored Markdown Features

GFM extends standard Markdown with powerful features[^1]. Here's a comprehensive demo:

## Tables

| Feature | Standard MD | GFM |
|---------|------------|-----|
| Tables | ❌ | ✅ |
| Task Lists | ❌ | ✅ |
| Strikethrough | ❌ | ✅ |

## Task Lists

- [x] Implement authentication
- [x] Add database models
- [ ] Write unit tests
- [ ] Deploy to production

## Strikethrough

~~Old approach~~ → New approach with AI models[^2]

[^1]: GitHub Flavored Markdown is a strict superset of CommonMark, maintained by GitHub.
[^2]: Modern AI models provide more intelligent and context-aware solutions.
`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Find the footnotes section
    const footnotesSection = container.querySelector("section[data-footnotes]");
    expect(footnotesSection).toBeTruthy();

    // Get all footnote list items
    const footnoteItems = container.querySelectorAll(
      'section[data-footnotes] li[data-streamdown="list-item"]'
    );

    // Check that both footnotes exist
    expect(footnoteItems.length).toBe(2);

    // Check that footnote text is present in the HTML
    const html = container.innerHTML;
    expect(html).toContain("GitHub Flavored Markdown is a strict superset");
    expect(html).toContain("Modern AI models provide more intelligent");
  });

  it("should filter out empty footnotes during streaming", () => {
    // Simulate streaming where footnote definition has no content yet
    const markdown = `Text with footnote[^1].

[^1]:`;

    const { container } = render(
      <Streamdown isAnimating={true}>{markdown}</Streamdown>
    );

    const footnotesSection = container.querySelector("section[data-footnotes]");

    if (footnotesSection) {
      // If section exists, it should have no visible footnotes
      const footnoteItems = footnotesSection.querySelectorAll(
        'li[data-streamdown="list-item"]'
      );
      expect(footnoteItems.length).toBe(0);
    }
  });

  it("should show footnotes once content arrives", () => {
    // Simulate streaming where definition has partial content
    const markdown = `Text with footnote[^1].

[^1]: This is the content`;

    const { container } = render(
      <Streamdown isAnimating={true}>{markdown}</Streamdown>
    );

    const footnotesSection = container.querySelector("section[data-footnotes]");
    expect(footnotesSection).toBeTruthy();

    const footnoteItems = footnotesSection?.querySelectorAll(
      'li[data-streamdown="list-item"]'
    );
    expect(footnoteItems?.length).toBe(1);
    expect(container.innerHTML).toContain("This is the content");
  });
});
