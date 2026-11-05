import { describe, expect, it } from "vitest";
import remend from "../src";

describe("single tilde escape (#445)", () => {
  it("should escape single ~ between numbers", () => {
    expect(remend("20~25°C")).toBe("20\\~25°C");
  });

  it("should escape multiple single tildes between numbers", () => {
    expect(remend("20~25°C。20~25°C")).toBe("20\\~25°C。20\\~25°C");
  });

  it("should escape single ~ between letters", () => {
    expect(remend("foo~bar")).toBe("foo\\~bar");
  });

  it("should not escape ~~ (double tilde strikethrough)", () => {
    expect(remend("~~strikethrough~~")).toBe("~~strikethrough~~");
  });

  it("should not escape ~ at start or end of text", () => {
    expect(remend("~hello")).toBe("~hello");
    expect(remend("hello~")).toBe("hello~");
  });

  it("should not escape ~ surrounded by spaces", () => {
    expect(remend("hello ~ world")).toBe("hello ~ world");
  });

  it("should not escape ~ inside code blocks", () => {
    expect(remend("```\n20~25\n```")).toBe("```\n20~25\n```");
  });

  it("should not escape ~ inside inline code", () => {
    expect(remend("`20~25`")).toBe("`20~25`");
  });

  it("should handle incomplete strikethrough separately from single tilde", () => {
    expect(remend("20~25 and ~~strike")).toBe("20\\~25 and ~~strike~~");
  });

  it("can be disabled via options", () => {
    expect(remend("20~25°C", { singleTilde: false })).toBe("20~25°C");
  });

  it("should preserve Unicode letters around single ~", () => {
    expect(remend("日本~語")).toBe("日本\\~語");
    expect(remend("α~β")).toBe("α\\~β");
    expect(remend("é~x")).toBe("é\\~x");
  });

  it("should preserve supplementary-plane Unicode letters around single ~", () => {
    expect(remend("𐐀~a")).toBe("𐐀\\~a");
  });

  it("should escape multiple single tildes between letters", () => {
    expect(remend("foo~bar~baz")).toBe("foo\\~bar\\~baz");
  });

  it("should not escape ~ inside a bare URL", () => {
    expect(remend("See https://example.com/v1~2/page now")).toBe(
      "See https://example.com/v1~2/page now"
    );
    expect(remend("See www.example.com/a~b now")).toBe(
      "See www.example.com/a~b now"
    );
    expect(remend("详见https://example.com/a~b")).toBe(
      "详见https://example.com/a~b"
    );
  });

  it("should not escape ~ inside an angle bracket autolink", () => {
    expect(remend("See <https://example.com/a~b> now")).toBe(
      "See <https://example.com/a~b> now"
    );
  });

  it("should not escape ~ inside an HTML attribute", () => {
    expect(remend('<a href="https://example.com/a~b">link</a>')).toBe(
      '<a href="https://example.com/a~b">link</a>'
    );
    expect(remend('<img src="/files/a~b.png">')).toBe(
      '<img src="/files/a~b.png">'
    );
  });

  it("should still escape ~ in prose next to URLs and tags", () => {
    expect(remend("https://example.com 20~25")).toBe(
      "https://example.com 20\\~25"
    );
    expect(remend("<b>20~25</b>")).toBe("<b>20\\~25</b>");
    expect(remend('<a href="https://example.com">20~25</a>')).toBe(
      '<a href="https://example.com">20\\~25</a>'
    );
  });

  it("should still escape ~ after URL-like text that GFM does not link", () => {
    // GFM links www. only at the start, after whitespace or after ( * _ [ ] ~
    expect(remend("详见www.example.com，温度20~25°C，湿度40~60%")).toBe(
      "详见www.example.com，温度20\\~25°C，湿度40\\~60%"
    );
    // and http(s):// only when no letter comes right before it
    expect(remend("abchttps://example.com/a~b")).toBe(
      "abchttps://example.com/a\\~b"
    );
  });
});
