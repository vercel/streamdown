import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("strikethrough formatting (~~)", () => {
  it("should complete incomplete strikethrough", () => {
    expect(parseIncompleteMarkdown("Text with ~~strike")).toBe(
      "Text with ~~strike~~"
    );
    expect(parseIncompleteMarkdown("~~incomplete")).toBe("~~incomplete~~");
  });

  it("should keep complete strikethrough unchanged", () => {
    const text = "Text with ~~strikethrough text~~";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple strikethrough sections", () => {
    const text = "~~strike1~~ and ~~strike2~~";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should complete odd number of strikethrough markers", () => {
    expect(parseIncompleteMarkdown("~~first~~ and ~~second")).toBe(
      "~~first~~ and ~~second~~"
    );
  });
});
