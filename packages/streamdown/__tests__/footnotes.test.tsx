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
    const footnoteRefs = container.querySelectorAll('sup[data-streamdown="superscript"]');
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(2);

    // Check that the footnote definition section exists
    const footnoteDef = container.querySelector('section[data-footnotes]');
    expect(footnoteDef).toBeTruthy();

    // Check that footnote list items exist with correct IDs
    const footnote1 = container.querySelector('li[id="user-content-fn-1"]');
    const footnote2 = container.querySelector('li[id="user-content-fn-2"]');
    expect(footnote1).toBeTruthy();
    expect(footnote2).toBeTruthy();

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
    const footnoteRefs = container.querySelectorAll('sup[data-streamdown="superscript"]');
    expect(footnoteRefs.length).toBeGreaterThanOrEqual(3);

    // Check that the footnote section exists
    const footnoteDef = container.querySelector('section[data-footnotes]');
    expect(footnoteDef).toBeTruthy();

    // Check that all three footnote definitions exist
    const footnote1 = container.querySelector('li[id="user-content-fn-1"]');
    const footnote2 = container.querySelector('li[id="user-content-fn-2"]');
    const footnote3 = container.querySelector('li[id="user-content-fn-3"]');
    expect(footnote1).toBeTruthy();
    expect(footnote2).toBeTruthy();
    expect(footnote3).toBeTruthy();
  });

  it("should handle footnotes with alphanumeric labels", () => {
    const markdown = `Reference with label[^note1].

[^note1]: This is a labeled footnote.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Check that the footnote reference exists
    const footnoteRef = container.querySelector('sup[data-streamdown="superscript"]');
    expect(footnoteRef).toBeTruthy();

    // Check that the footnote definition section exists
    const footnoteDef = container.querySelector('section[data-footnotes]');
    expect(footnoteDef).toBeTruthy();

    // Check that the footnote definition exists
    const footnote = container.querySelector('li[id="user-content-fn-note1"]');
    expect(footnote).toBeTruthy();
    expect(container.innerHTML).toContain("This is a labeled footnote");
  });
});
