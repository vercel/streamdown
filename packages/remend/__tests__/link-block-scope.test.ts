import { describe, expect, it } from "vitest";
import remend from "../src";

describe("link healing stays in the last inline block", () => {
  it("does not close a bracket from an earlier paragraph", () => {
    expect(remend("See [1 for details.\n\nThe next paragraph")).toBe(
      "See [1 for details.\n\nThe next paragraph"
    );
    expect(remend("Arrays use x[i notation.\n\nThen we")).toBe(
      "Arrays use x[i notation.\n\nThen we"
    );
  });

  it("keeps later paragraphs after an earlier unfinished URL", () => {
    const text =
      "Read [the docs](https://example.com/guide\n\nNext paragraph keeps streaming";
    expect(remend(text)).toBe(text);
  });

  it('does not pair a later "](" with a bracket from an earlier block', () => {
    const text = "Text [a\n\nb](https://exa";
    expect(remend(text)).toBe(text);
  });

  it("does not move an image's later paragraphs into its alt text", () => {
    expect(remend("![diagram\n\nThe caption follows")).toBe(
      "![diagram\n\nThe caption follows"
    );
  });

  it("treats list items, headings and table rows as separate blocks", () => {
    expect(remend("- item [one\n- item two")).toBe("- item [one\n- item two");
    expect(remend("# Title [x\nBody text")).toBe("# Title [x\nBody text");
    expect(remend("| a [b | c |\n| d | e")).toBe("| a [b | c |\n| d | e");
  });

  it("still heals an incomplete link in the current block", () => {
    expect(remend("Done.\n\nSee [the docs")).toBe(
      "Done.\n\nSee [the docs](streamdown:incomplete-link)"
    );
    expect(remend("See [1 here.\n\nRead [the docs](https://exa")).toBe(
      "See [1 here.\n\nRead [the docs](streamdown:incomplete-link)"
    );
    expect(remend("- item [one\n- item [two")).toBe(
      "- item [one\n- item [two](streamdown:incomplete-link)"
    );
    expect(remend("> quote [link\n> continues")).toBe(
      "> quote [link\n> continues](streamdown:incomplete-link)"
    );
    expect(remend("- item [link\n  continues")).toBe(
      "- item [link\n  continues](streamdown:incomplete-link)"
    );
  });

  it("leaves earlier brackets alone in text-only mode", () => {
    expect(
      remend("See [1 for details.\n\nRead [the docs", { linkMode: "text-only" })
    ).toBe("See [1 for details.\n\nRead the docs");
  });
});
