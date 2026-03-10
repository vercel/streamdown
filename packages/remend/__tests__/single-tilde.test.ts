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
});
