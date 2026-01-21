import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("HTML Block Elements with Multiline Content - #164", () => {
  it("should render multiline content inside details element", () => {
    const content = `<details>
<summary>Summary</summary>

Paragraph inside details.
</details>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const details = container.querySelector("details");
    const paragraph = container.querySelector("p");

    expect(details).toBeTruthy();
    expect(paragraph).toBeTruthy();
    // The paragraph should be inside the details element
    expect(details?.contains(paragraph as Node)).toBe(true);
  });

  it("should render multiline content inside div element", () => {
    const content = `<div>

Paragraph inside div.
</div>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const div = container.querySelectorAll("div");
    const paragraph = container.querySelector("p");

    expect(div.length).toBeGreaterThan(0);
    expect(paragraph).toBeTruthy();
    // The paragraph should be inside a div element
    const containingDiv = paragraph?.closest("div");
    expect(containingDiv).toBeTruthy();
  });

  it("should handle multiple paragraphs inside details", () => {
    const content = `<details>
<summary>Summary</summary>

First paragraph.

Second paragraph.
</details>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const details = container.querySelector("details");
    const paragraphs = container.querySelectorAll("p");

    expect(details).toBeTruthy();
    expect(paragraphs.length).toBeGreaterThan(0);
    // All paragraphs should be inside the details element
    for (const p of paragraphs) {
      expect(details?.contains(p)).toBe(true);
    }
  });

  it("should preserve nested structure in complex HTML blocks", () => {
    const content = `<div>
<details>
<summary>Nested Summary</summary>

Content in nested structure.
</details>
</div>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const details = container.querySelector("details");
    const paragraph = container.querySelector("p");

    expect(details).toBeTruthy();
    expect(paragraph).toBeTruthy();
    // The paragraph should be inside the details element
    expect(details?.contains(paragraph as Node)).toBe(true);
  });

  it("should handle img tag as self-closing HTML element", () => {
    const content = `<p>Before image</p>
<img src="https://example.com/image.jpg" alt="Test Image" width="100" height="100">
<p>After image</p>`;

    const { container } = render(<Streamdown>{content}</Streamdown>);
    const img = container.querySelector("img");
    const paragraphs = container.querySelectorAll("p");

    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/image.jpg");
    expect(img?.getAttribute("alt")).toBe("Test Image");
    expect(img?.getAttribute("width")).toBe("100");
    expect(img?.getAttribute("height")).toBe("100");
    expect(paragraphs.length).toBe(2);
  });
});
