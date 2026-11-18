import { describe, expect, it } from "vitest";
import remend from "../src";

const bestTime = (input: string) => {
  remend(input);
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    remend(input);
    best = Math.min(best, performance.now() - start);
  }
  return best;
};

// GFM links a bare http://, https:// or www. URL as it is, so a marker inside
// one is part of the link and a closer added for it renders as text
describe("markers inside bare URLs", () => {
  it("should not close an underscore inside a URL path", () => {
    expect(
      remend(
        "Static files are served from https://example.com/_next/static in production."
      )
    ).toBe(
      "Static files are served from https://example.com/_next/static in production."
    );
    expect(remend("Visit www.example.com/_next/static")).toBe(
      "Visit www.example.com/_next/static"
    );
  });

  it("should not close a double underscore while the URL streams", () => {
    expect(
      remend("See https://github.com/python/cpython/blob/main/Lib/__init")
    ).toBe("See https://github.com/python/cpython/blob/main/Lib/__init");
    expect(
      remend(
        "Read https://docs.python.org/3/reference/datamodel.html#object.__in"
      )
    ).toBe(
      "Read https://docs.python.org/3/reference/datamodel.html#object.__in"
    );
  });

  it("should not close asterisks or tildes inside a URL", () => {
    expect(
      remend("The route https://example.com/*/items matches everything")
    ).toBe("The route https://example.com/*/items matches everything");
    expect(remend("See https://example.com/~~a")).toBe(
      "See https://example.com/~~a"
    );
  });

  it("should find URLs in block quotes and list items", () => {
    expect(remend("> www.example.com/_next")).toBe("> www.example.com/_next");
    expect(remend(">www.example.com/_next")).toBe(">www.example.com/_next");
    expect(remend("- https://example.com/_next")).toBe(
      "- https://example.com/_next"
    );
  });

  it("should not change the URL of a link definition", () => {
    expect(remend("[docs]: https://example.com/_a")).toBe(
      "[docs]: https://example.com/_a"
    );
  });

  it("should treat a URL right after CJK text as a URL", () => {
    expect(remend("官网：https://example.com/_next")).toBe(
      "官网：https://example.com/_next"
    );
  });

  it("should still close emphasis around a URL", () => {
    expect(remend("**see https://example.com/_next")).toBe(
      "**see https://example.com/_next**"
    );
    expect(remend("_see https://example.com/_next")).toBe(
      "_see https://example.com/_next_"
    );
    expect(remend("See (https://example.com/_a) **more")).toBe(
      "See (https://example.com/_a) **more**"
    );
  });

  it("should keep trailing punctuation out of the URL", () => {
    expect(remend("**https://example.com**")).toBe("**https://example.com**");
    expect(remend("_see https://example.com/foo_ bar")).toBe(
      "_see https://example.com/foo_ bar"
    );
  });

  it("should heal markers in text GFM doesn't link", () => {
    // http:// right after a letter isn't a link
    expect(remend("abchttps://example.com/_a")).toBe(
      "abchttps://example.com/_a_"
    );
    // nor is a domain with an underscore in its last two segments
    expect(remend("www.example_site.com/_a")).toBe("www.example_site.com/_a_");
  });

  it("stays linear for www. prefixes inside a rejected domain", () => {
    const make = (n: number) => `${"www.a_".repeat(n)} **x`;
    const small = make(2000);
    const large = make(8000);

    expect(remend(large)).toBe(`${large}**`);
    // Quadrupling the input costs ~4x for a linear scan, ~16x if every
    // www. rescans the rest of the domain.
    expect(bestTime(large) / bestTime(small)).toBeLessThan(10);
  });
});
