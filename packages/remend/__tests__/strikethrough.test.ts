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

  it("should complete half-complete ~~ closing marker (#313)", () => {
    // When streaming ~~strike~~, the closing marker arrives char by char
    // ~~strike~ is a half-complete closing marker
    expect(remend("~~xxx~")).toBe("~~xxx~~");
    expect(remend("~~strike text~")).toBe("~~strike text~~");
    expect(remend("Text with ~~strike~")).toBe("Text with ~~strike~~");
    expect(remend("This is ~~strikethrough~")).toBe(
      "This is ~~strikethrough~~"
    );
  });
});
