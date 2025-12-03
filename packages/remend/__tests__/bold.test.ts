import { describe, expect, it } from "vitest";
import remend from "../src";

describe("bold formatting (**)", () => {
  it("should complete incomplete bold formatting", () => {
    expect(remend("Text with **bold")).toBe("Text with **bold**");
    expect(remend("**incomplete")).toBe("**incomplete**");
  });

  it("should keep complete bold formatting unchanged", () => {
    const text = "Text with **bold text**";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple bold sections", () => {
    const text = "**bold1** and **bold2**";
    expect(remend(text)).toBe(text);
  });

  it("should complete odd number of bold markers", () => {
    expect(remend("**first** and **second")).toBe("**first** and **second**");
  });

  it("should handle partial bold text at chunk boundary", () => {
    expect(remend("Here is some **bold tex")).toBe("Here is some **bold tex**");
  });
});
