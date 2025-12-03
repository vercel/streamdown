import { describe, expect, it } from "vitest";
import remend from "../src";

describe("strikethrough formatting (~~)", () => {
  it("should complete incomplete strikethrough", () => {
    expect(remend("Text with ~~strike")).toBe("Text with ~~strike~~");
    expect(remend("~~incomplete")).toBe("~~incomplete~~");
  });

  it("should keep complete strikethrough unchanged", () => {
    const text = "Text with ~~strikethrough text~~";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple strikethrough sections", () => {
    const text = "~~strike1~~ and ~~strike2~~";
    expect(remend(text)).toBe(text);
  });

  it("should complete odd number of strikethrough markers", () => {
    expect(remend("~~first~~ and ~~second")).toBe("~~first~~ and ~~second~~");
  });
});
