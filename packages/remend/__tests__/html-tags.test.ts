import { describe, expect, it } from "vitest";
import remend from "../src";

describe("incomplete HTML tag stripping", () => {
  it("should strip incomplete opening tags at end", () => {
    expect(remend("Hello <div")).toBe("Hello");
    expect(remend("Hello <custom")).toBe("Hello");
    expect(remend("Hello <casecard")).toBe("Hello");
    expect(remend("Text <MyComponent")).toBe("Text");
  });

  it("should strip incomplete closing tags at end", () => {
    expect(remend("Hello </div")).toBe("Hello");
    expect(remend("Hello </custom")).toBe("Hello");
    expect(remend("<div>content</di")).toBe("<div>content");
  });

  it("should strip incomplete tags with partial attributes", () => {
    expect(remend('Hello <div class="foo')).toBe("Hello");
    expect(remend("Hello <div class=")).toBe("Hello");
    expect(remend('Hello <a href="https://example.com')).toBe("Hello");
    expect(remend("<custom data-id")).toBe("");
  });

  it("should keep complete tags unchanged", () => {
    expect(remend("Hello <div>")).toBe("Hello <div>");
    expect(remend("<div>content</div>")).toBe("<div>content</div>");
    expect(remend("<br/>")).toBe("<br/>");
    expect(remend("<img src='test'>")).toBe("<img src='test'>");
  });

  it("should not strip < followed by space or number", () => {
    expect(remend("3 < 5")).toBe("3 < 5");
    expect(remend("x < y")).toBe("x < y");
    expect(remend("if a <")).toBe("if a <");
    expect(remend("value <1")).toBe("value <1");
  });

  it("should not strip inside code blocks", () => {
    expect(remend("```\n<div\n```")).toBe("```\n<div\n```");
    expect(remend("```html\n<custom")).toBe("```html\n<custom");
  });

  it("should not strip inside inline code", () => {
    expect(remend("`<div`")).toBe("`<div`");
  });

  it("should handle tag at start of text", () => {
    expect(remend("<div")).toBe("");
    expect(remend("<custom")).toBe("");
    expect(remend("</div")).toBe("");
  });

  it("should strip only the incomplete tag, preserving prior content", () => {
    expect(remend("Some text here\n\n<casecard")).toBe("Some text here");
    expect(remend("# Heading\n\nParagraph <custom")).toBe(
      "# Heading\n\nParagraph"
    );
  });

  it("should handle complete tag followed by incomplete tag", () => {
    expect(remend("<div>Hello</div> <span")).toBe("<div>Hello</div>");
  });

  it("should not add trailing underscore for HTML attributes with underscores", () => {
    expect(remend('<a target="_blank" href="https://link.com">word</a>')).toBe(
      '<a target="_blank" href="https://link.com">word</a>'
    );
    expect(remend('<a target="_blank">link</a>')).toBe(
      '<a target="_blank">link</a>'
    );
    expect(remend('<iframe src="x" sandbox="allow_scripts">')).toBe(
      '<iframe src="x" sandbox="allow_scripts">'
    );
  });

  it("should be disabled when htmlTags option is false", () => {
    expect(remend("Hello <div", { htmlTags: false })).toBe("Hello <div");
  });
});
