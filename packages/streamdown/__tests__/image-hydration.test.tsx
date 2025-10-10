import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("Image hydration error fix", () => {
  it("should not wrap images in <p> tags to prevent hydration errors", () => {
    const markdown = `## Links

[GitHub](https://github.com/)

![Image](https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png)`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Find the image wrapper div
    const imageWrapper = container.querySelector(
      '[data-streamdown="image-wrapper"]'
    );
    expect(imageWrapper).toBeTruthy();
    expect(imageWrapper?.tagName).toBe("DIV");

    // Ensure the image wrapper is NOT inside a <p> tag
    const parentElement = imageWrapper?.parentElement;
    expect(parentElement?.tagName).not.toBe("P");

    // Verify the image is rendered correctly
    const img = container.querySelector('[data-streamdown="image"]');
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe(
      "https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png"
    );
    expect(img?.getAttribute("alt")).toBe("Image");
  });

  it("should render normal paragraph text correctly", () => {
    const markdown = `This is a normal paragraph with text.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Find the paragraph
    const paragraph = container.querySelector("p");
    expect(paragraph).toBeTruthy();
    expect(paragraph?.textContent).toBe("This is a normal paragraph with text.");
  });

  it("should handle images mixed with text in a paragraph", () => {
    const markdown = `This is text with ![Image](https://example.com/image.png) inline.`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // When an image is mixed with text, it should remain in a paragraph
    const paragraph = container.querySelector("p");
    expect(paragraph).toBeTruthy();

    // The image should still be rendered
    const img = container.querySelector('[data-streamdown="image"]');
    expect(img).toBeTruthy();
  });

  it("should handle multiple standalone images", () => {
    const markdown = `![Image 1](https://example.com/image1.png)

![Image 2](https://example.com/image2.png)`;

    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    // Find all image wrappers
    const imageWrappers = container.querySelectorAll(
      '[data-streamdown="image-wrapper"]'
    );
    expect(imageWrappers.length).toBe(2);

    // Ensure neither image wrapper is inside a <p> tag
    for (const wrapper of imageWrappers) {
      const parentElement = wrapper.parentElement;
      expect(parentElement?.tagName).not.toBe("P");
    }
  });
});
