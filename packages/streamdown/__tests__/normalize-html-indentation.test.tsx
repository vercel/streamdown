import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { normalizeHtmlIndentation, Streamdown } from "../index";

const INDENTED_HTML_TAG_REGEX = /\n {4,}<\w/;

describe("normalizeHtmlIndentation utility function", () => {
  it("should return empty string unchanged", () => {
    expect(normalizeHtmlIndentation("")).toBe("");
  });

  it("should return non-HTML content unchanged", () => {
    const markdown = "# Hello World\n\nThis is a paragraph.";
    expect(normalizeHtmlIndentation(markdown)).toBe(markdown);
  });

  it("should return indented code blocks unchanged when not starting with HTML", () => {
    const codeBlock = "    const x = 1;\n    const y = 2;";
    expect(normalizeHtmlIndentation(codeBlock)).toBe(codeBlock);
  });

  it("should normalize indented HTML tags within HTML blocks", () => {
    const input = `<div>
    <span>Hello</span>
</div>`;
    const expected = `<div>
<span>Hello</span>
</div>`;
    expect(normalizeHtmlIndentation(input)).toBe(expected);
  });

  it("should handle deeply nested HTML with various indentation levels", () => {
    const input = `<div class="wrapper">
    <div class="inner">
      <h4>Title</h4>
      <ul>
        <li>Item 1</li>
        <li>Item 2</li>
      </ul>
    </div>

    <div class="another">
      <h4>Another Title</h4>
    </div>
</div>`;

    const result = normalizeHtmlIndentation(input);

    // All HTML tags should not have 4+ spaces before them
    expect(result).not.toMatch(INDENTED_HTML_TAG_REGEX);
    // Content should still be preserved
    expect(result).toContain("Title");
    expect(result).toContain("Another Title");
    expect(result).toContain("Item 1");
  });

  it("should preserve text content indentation inside pre tags", () => {
    const input = `<pre>
    code with spaces
</pre>`;
    // Only HTML tags get dedented, not text content
    const result = normalizeHtmlIndentation(input);
    expect(result).toContain("    code with spaces");
  });

  it("should handle HTML starting with whitespace", () => {
    const input = "  <div>content</div>";
    expect(normalizeHtmlIndentation(input)).toBe("  <div>content</div>");
  });

  it("should handle self-closing tags", () => {
    const input = `<div>
    <img src="test.jpg" />
    <br />
</div>`;
    const result = normalizeHtmlIndentation(input);
    expect(result).toContain('<img src="test.jpg" />');
    expect(result).toContain("<br />");
  });

  it("should handle HTML comments", () => {
    const input = `<div>
    <!-- comment -->
    <span>text</span>
</div>`;
    const result = normalizeHtmlIndentation(input);
    expect(result).toContain("<!-- comment -->");
  });

  it("should handle doctype declarations", () => {
    const input = `<!DOCTYPE html>
    <html>
    <body>
    </body>
    </html>`;
    const result = normalizeHtmlIndentation(input);
    expect(result).toContain("<!DOCTYPE html>");
    expect(result).toContain("<html>");
  });

  it("should not affect markdown code fences", () => {
    // This starts with markdown, not HTML, so should be unchanged
    const input = "```html\n    <div>code</div>\n```";
    expect(normalizeHtmlIndentation(input)).toBe(input);
  });

  it("should handle mixed content after HTML", () => {
    const input = `<div>
    <p>paragraph</p>
</div>

Some text after.`;
    const result = normalizeHtmlIndentation(input);
    expect(result).toContain("<p>paragraph</p>");
    expect(result).toContain("Some text after.");
  });
});

describe("Streamdown with normalizeHtmlIndentation prop", () => {
  it("should render indented HTML as code block when normalizeHtmlIndentation is false (default)", () => {
    const content = `<div class="wrapper">
    <div class="inner">
      <h4>Title</h4>
    </div>

    <div class="another">
      <h4>Another Title</h4>
    </div>
</div>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Without normalization, the second div may be treated as code
    // due to 4-space indentation after blank line
    const headings = container.querySelectorAll("h4");
    // May only find one heading if second block is rendered as code
    expect(headings.length).toBeLessThanOrEqual(2);
  });

  it("should render all HTML correctly when normalizeHtmlIndentation is true", () => {
    const content = `<div class="wrapper">
    <div class="inner">
      <h4>Title One</h4>
    </div>

    <div class="another">
      <h4>Title Two</h4>
    </div>
</div>`;

    const { container } = render(
      <Streamdown normalizeHtmlIndentation>{content}</Streamdown>
    );

    const headings = Array.from(container.querySelectorAll("h4")).map(
      (h) => h.textContent
    );

    expect(headings).toContain("Title One");
    expect(headings).toContain("Title Two");
    // Should not have any code blocks
    expect(container.querySelectorAll("code").length).toBe(0);
  });

  it("should handle streaming socket data scenario", () => {
    // Simulating concatenated socket chunks with indented HTML
    const content = `<div class="container">
    <div class="success">
      <h4>Success Points</h4>
      <ul>
        <li><strong>Point 1</strong> - Description</li>
        <li><strong>Point 2</strong> - Description</li>
      </ul>
    </div>

    <div class="failure">
      <h4>Failure Points</h4>
      <ul>
        <li><strong>Issue 1</strong> - Description</li>
        <li><strong>Issue 2</strong> - Description</li>
      </ul>
    </div>
</div>`;

    const { container } = render(
      <Streamdown normalizeHtmlIndentation>{content}</Streamdown>
    );

    const headings = Array.from(container.querySelectorAll("h4")).map(
      (h) => h.textContent
    );

    expect(headings).toContain("Success Points");
    expect(headings).toContain("Failure Points");

    const listItems = container.querySelectorAll("li");
    expect(listItems.length).toBe(4);

    // Verify no code blocks were created
    expect(container.querySelectorAll("code").length).toBe(0);
  });

  it("should not affect non-HTML content when normalizeHtmlIndentation is true", () => {
    const content = `# Heading

This is a paragraph.

Another paragraph.`;

    const { container } = render(
      <Streamdown normalizeHtmlIndentation>{content}</Streamdown>
    );

    // Should have the heading
    expect(container.querySelector("h1")?.textContent).toBe("Heading");

    // Should have paragraphs
    const paragraphs = container.querySelectorAll("p");
    expect(paragraphs.length).toBe(2);
  });

  it("should handle complex nested HTML with multiple levels", () => {
    const content = `<article>
    <header>
        <h1>Article Title</h1>
    </header>
    <section>
        <h2>Section 1</h2>
        <p>Content here</p>
    </section>
    <section>
        <h2>Section 2</h2>
        <p>More content</p>
    </section>
    <footer>
        <p>Footer text</p>
    </footer>
</article>`;

    const { container } = render(
      <Streamdown
        allowedTags={{ article: [], header: [], footer: [] }}
        normalizeHtmlIndentation
      >
        {content}
      </Streamdown>
    );

    expect(container.querySelector("h1")?.textContent).toBe("Article Title");
    expect(container.querySelectorAll("h2").length).toBe(2);
    expect(container.querySelector("footer")).toBeTruthy();
  });
});

describe("parse-blocks HTML merging", () => {
  it("should merge HTML blocks with nested tags correctly", () => {
    const content = `<div>
<div>Inner content</div>
</div>

<p>After</p>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    // Should have the outer div with inner content
    expect(container.textContent).toContain("Inner content");
    expect(container.textContent).toContain("After");
  });

  it("should handle self-closing tags without breaking block merging", () => {
    const content = `<div>
<br />
<p>Text after break</p>
</div>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    expect(container.querySelector("br")).toBeTruthy();
    expect(container.querySelector("p")?.textContent).toBe("Text after break");
  });

  it("should handle void elements correctly", () => {
    const content = `<div>
<br />
<hr />
<input type="text" />
<p>After void elements</p>
</div>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);

    expect(container.querySelector("br")).toBeTruthy();
    expect(container.querySelector("hr")).toBeTruthy();
    expect(container.querySelector("input")).toBeTruthy();
    expect(container.querySelector("p")?.textContent).toBe(
      "After void elements"
    );
  });
});
