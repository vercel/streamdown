import { describe, expect, it } from "vitest";
import remend from "../src";

interface Row {
  expected: string;
  input: string;
  name: string;
}

describe("emphasis nesting", () => {
  it.each<Row>([
    {
      name: "strikethrough inside bold",
      input: "**bold ~~strike",
      expected: "**bold ~~strike~~**",
    },
    {
      name: "italic inside bold inside strikethrough",
      input: "~~strike **bold *italic",
      expected: "~~strike **bold *italic***~~",
    },
    {
      name: "code span inside bold",
      input: "**bold with `code",
      expected: "**bold with `code`**",
    },
    {
      name: "closed italic after an open bold",
      input: "**a_~~*~~*",
      expected: "**a_~~*~~***",
    },
  ])("closes in nesting order: $name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
    expect(remend(expected)).toBe(expected);
  });

  it.each<Row>([
    {
      name: "ordered list items",
      input: "1. **a\n2. **b",
      expected: "1. **a\n2. **b**",
    },
    {
      name: "paragraphs",
      input: "**Summary\n\nThe *quick",
      expected: "**Summary\n\nThe *quick*",
    },
    {
      name: "blockquotes",
      input: "> **a\n\n> **b",
      expected: "> **a\n\n> **b**",
    },
    {
      name: "lazy continuation line",
      input: "- **text\nmore text",
      expected: "- **text\nmore text**",
    },
  ])("pairs within one block: $name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
    expect(remend(expected)).toBe(expected);
  });

  it.each<Row>([
    {
      name: "after an odd number of prices",
      input: "Pay $50 now, then **$1,15",
      expected: "Pay $50 now, then **$1,15**",
    },
    {
      name: "after prices in an earlier paragraph",
      input: "From $5 to $9 and $12.\n\n**Total: $276.",
      expected: "From $5 to $9 and $12.\n\n**Total: $276.**",
    },
    {
      name: "beside display math",
      input: "$$x**2$$ is **big",
      expected: "$$x**2$$ is **big**",
    },
  ])("treats a lone dollar sign as text: $name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
    expect(remend(expected)).toBe(expected);
  });

  it("hides markers inside inline math when it is opted in", () => {
    expect(remend("Pay $a **b$ and **c", { inlineKatex: true })).toBe(
      "Pay $a **b$ and **c**"
    );
  });

  it.each<Row>([
    {
      name: "closer before a word",
      input: "**Note:**This is important.",
      expected: "**Note:**This is important.",
    },
    {
      name: "closer after fullwidth punctuation",
      input: "**注意：**这是重要的。",
      expected: "**注意：**这是重要的。",
    },
    {
      name: "globs",
      input: "Matches *.ts and *.tsx files",
      expected: "Matches *.ts and *.tsx files",
    },
    {
      name: "field names",
      input: "Fields _id, _rev, _key",
      expected: "Fields _id, _rev, _key",
    },
    {
      name: "word-internal ASCII asterisks",
      input: "hello**world",
      expected: "hello**world",
    },
    {
      name: "asterisk between an ASCII letter and CJK",
      input: "使用A*算法",
      expected: "使用A*算法",
    },
    {
      name: "opener inside a link label",
      input: "[*a](u)",
      expected: "[*a](u)",
    },
    {
      name: "strikethrough around a link nested in brackets",
      input: "[[](u)~~](u)~~]",
      expected: "[[](u)~~](u)~~]",
    },
  ])("keeps literal markers: $name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
    expect(remend(expected)).toBe(expected);
  });

  it.each<Row>([
    {
      name: "bold after CJK text",
      input: "这是**粗体",
      expected: "这是**粗体**",
    },
    {
      name: "bold inside Thai text",
      input: "คำ**ที่**ดี",
      expected: "คำ**ที่**ดี",
    },
  ])("handles Unicode: $name", ({ input, expected }) => {
    expect(remend(input)).toBe(expected);
    expect(remend(expected)).toBe(expected);
  });

  it.each([
    { name: "many open italic runs", input: " *x".repeat(200) },
    {
      name: "many distinct open runs",
      input: [
        ..."123456".split("").map((n) => ` ${"*".repeat(Number(n))}a`),
        ..."12345".split("").map((n) => ` ${"_".repeat(Number(n))}b`),
        " ~~c",
      ].join(""),
    },
    {
      name: "long prose with an open bold",
      input: `${"prose with *emph* and **bold** here. ".repeat(300)}**tail`,
    },
  ])("stays fast: $name", ({ input }) => {
    remend(input);
    const start = performance.now();
    remend(input);
    expect(performance.now() - start).toBeLessThan(50);
  });
});
