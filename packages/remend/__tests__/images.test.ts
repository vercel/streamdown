import { describe, expect, it } from "vitest";
import remend from "../src";

describe("image handling", () => {
  it("should replace incomplete images with placeholder", () => {
    expect(remend("Text with ![incomplete image")).toBe(
      "Text with ![incomplete image](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
    expect(remend("![partial")).toBe(
      "![partial](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
  });

  it("should keep complete images unchanged", () => {
    const text = "Text with ![alt text](image.png)";
    expect(remend(text)).toBe(text);
  });

  it("should handle partial image at chunk boundary", () => {
    expect(remend("See ![the diag")).toBe(
      "See ![the diag](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
    // Images with partial URLs should use placeholder (not removed)
    expect(remend("![logo](./assets/log")).toBe(
      "![logo](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
  });

  it("should handle nested brackets in incomplete images", () => {
    // When findMatchingClosingBracket returns -1 for an image (lines 74-79)
    // For this to happen, we need an opening bracket with a ] but no proper matching
    expect(remend("Text ![outer [inner]")).toBe(
      "Text ![outer [inner]](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
    expect(remend("![nested [brackets] text")).toBe(
      "![nested [brackets] text](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
    expect(remend("Start ![foo [bar] baz")).toBe(
      "Start ![foo [bar] baz](data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=)"
    );
  });

  it("should not add trailing underscore for images with underscores in URL (#284)", () => {
    const markdown =
      "textContent ![image](https://img.alicdn.com/imgextra/i4/6000000003603/O1CN01ApW8bQ1cUE8LduPra_!!6000000003603-2-skyky.png)";
    expect(remend(markdown)).toBe(markdown);

    // Should also work with links containing underscores
    const linkMarkdown =
      "textContent [link](https://example.com/path_name!!test)";
    expect(remend(linkMarkdown)).toBe(linkMarkdown);

    // Multiple images should also work
    const multipleImages =
      "textContent ![image1](https://example.com/path_1!!test.png) ![image2](https://example.com/path_2!!test.png)";
    expect(remend(multipleImages)).toBe(multipleImages);
  });
});
