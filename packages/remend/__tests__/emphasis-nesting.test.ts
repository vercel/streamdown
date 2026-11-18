import { describe, expect, it } from "vitest";
import remend from "../src";

interface Row {
  expected: string;
  input: string;
  name: string;
}

const bestTime = (input: string, options?: Parameters<typeof remend>[1]) => {
  remend(input, options);
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < 5; i++) {
    const start = performance.now();
    remend(input, options);
    best = Math.min(best, performance.now() - start);
  }
  return best;
};

// Wall-clock budgets flake on shared CI runners, so compare growth instead:
// quadrupling the input costs ~4x when linear and ~16x when quadratic.
const growth = (
  make: (n: number) => string,
  n: number,
  options?: Parameters<typeof remend>[1]
) => bestTime(make(n * 4), options) / bestTime(make(n), options);

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
      name: "bold left open when its line ended",
      input: "- **text\nmore text",
      expected: "- **text\nmore text",
    },
    {
      name: "bold after a closer that failed flanking",
      input: "**Note:**This is **imp",
      expected: "**Note:**This is **imp**",
    },
    {
      name: "bold around a pair opened after fullwidth punctuation",
      input: "**机器学习（ML）**是一个分支，能够**从数",
      expected: "**机器学习（ML）**是一个分支，能够**从数**",
    },
    {
      name: "asterisk in link text resolves before strikethrough",
      input: "[*](u)~~*~~*a",
      expected: "[*](u)~~*~~*a~~",
    },
    {
      name: "dash that starts the next list item",
      input: "_*\n- ",
      expected: "_*\n- \u200B",
    },
    {
      name: "bold before a dash rule",
      input: "**-----",
      expected: "**-----**",
    },
    {
      name: "paragraph after an empty list item",
      input: "*\n~~**a ~~`",
      expected: "*\n~~**a ~~`**",
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
      name: "fill-in blank before punctuation",
      input: "Can we discuss ______? It is",
      expected: "Can we discuss ______? It is",
    },
    {
      name: "fill-in blank between fullwidth punctuation",
      input: "电话：__________（可向",
      expected: "电话：__________（可向",
    },
    {
      name: "asterisk chain that opened inside a word",
      input: 'Watch "M*A*S*H" for the',
      expected: 'Watch "M*A*S*H" for the',
    },
    {
      name: "asterisk listed between commas",
      input: "Use operators (+, -, *, /), equals, and",
      expected: "Use operators (+, -, *, /), equals, and",
    },
    {
      name: "pointer in code outside a fence",
      input: "int f(car *cars, int n) {\n  return",
      expected: "int f(car *cars, int n) {\n  return",
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

  it("stays fast: many distinct open runs", () => {
    const input = [
      ..."123456".split("").map((n) => ` ${"*".repeat(Number(n))}a`),
      ..."12345".split("").map((n) => ` ${"_".repeat(Number(n))}b`),
      " ~~c",
    ].join("");
    expect(bestTime(input)).toBeLessThan(50);
  });

  it.each([
    {
      name: "many open italic runs",
      make: (n: number) => " *x".repeat(n),
      n: 800,
    },
    {
      name: "long prose with an open bold",
      make: (n: number) =>
        `${"prose with *emph* and **bold** here. ".repeat(n)}**tail`,
      n: 300,
    },
    {
      name: "a long delimiter run",
      make: (n: number) => `${"*".repeat(n)}text`,
      n: 16_000,
    },
    {
      name: "many mismatched delimiter runs",
      make: (n: number) => " *a_".repeat(n),
      n: 2000,
    },
    {
      name: "many link labels",
      make: (n: number) => "[*a](u)".repeat(n),
      n: 1000,
    },
  ])("stays linear on $name", ({ make, n }) => {
    expect(growth(make, n)).toBeLessThan(10);
  });

  it.each<Row>([
    {
      name: "a link deactivates its enclosing bracket",
      input: "[*outer [inner](u)](v)",
      expected: "[*outer [inner](u)](v)*",
    },
    {
      name: "an image leaves its enclosing bracket active",
      input: "[*outer ![inner](u)](v)",
      expected: "[*outer ![inner](u)](v)",
    },
    {
      name: "an escaped image marker still deactivates enclosing brackets",
      input: "[*outer \\![inner](u)](v)",
      expected: "[*outer \\![inner](u)](v)*",
    },
    {
      name: "new brackets stay active after an earlier link",
      input: "[one](u) [*two](v)",
      expected: "[one](u) [*two](v)",
    },
    {
      name: "inactive brackets consume closers before a later link",
      input: "[*outer [inner](u)](v) [*next](w)",
      expected: "[*outer [inner](u)](v) [*next](w)*",
    },
  ])("preserves link label scoping: $name", ({ input, expected }) => {
    const options = { links: false, images: false };
    expect(remend(input, options)).toBe(expected);
    expect(remend(expected, options)).toBe(expected);
  });

  it("stays linear for unmatched brackets before sibling links with link healing disabled", () => {
    const make = (n: number) => `${"[".repeat(n)}${"[*a](u)".repeat(n)}`;
    const options = { links: false, images: false };
    const input = make(16_000);

    expect(remend(input, options)).toBe(input);
    expect(growth(make, 4000, options)).toBeLessThan(10);
  });

  it.each([
    {
      name: "overlength openers",
      unit: `${"*".repeat(17)}~~~ `,
      options: {},
    },
    {
      name: "blank underscore openers",
      unit: "____~~~ ",
      options: {},
    },
    {
      name: "disabled italic openers",
      unit: "*~~~ ",
      options: { italic: false },
    },
  ])("stays linear when gating skips $name", ({ unit, options }) => {
    const make = (n: number) => `${unit.repeat(n)}x`;
    expect(remend(make(8000), options)).toBe(make(8000));
    expect(growth(make, 2000, options)).toBeLessThan(10);
  });

  // Every heal attempt rematches the whole block. These took seconds when an
  // attempt also compared every pair with every other to find nesting.
  it.each([
    {
      name: "many closed spans before an open bold",
      make: (n: number) => `${"*a* ".repeat(n)}**x`,
      n: 4000,
    },
    {
      name: "many nested closed spans before an open bold",
      make: (n: number) => `${"**a *b* c** ".repeat(n)}**x`,
      n: 1250,
    },
  ])("heals in linear time after $name", ({ make, n }) => {
    const input = make(n * 4);
    expect(remend(input)).toBe(`${input}**`);
    expect(growth(make, n)).toBeLessThan(10);
  });

  // Many closed spans times the attempts several open runs need runs past
  // the work budget, which leaves the markers literal
  const severalOpenRuns = (n: number) => `${"*a* ".repeat(n)}**x *y _z ~~w`;

  it.each([
    { name: "16k closed spans", repeat: 16_000 },
    { name: "60k closed spans", repeat: 60_000 },
  ])("leaves several open runs literal past the budget: $name", ({
    repeat,
  }) => {
    const input = severalOpenRuns(repeat);
    expect(remend(input)).toBe(input);
  });

  it("stays linear past the budget", () => {
    expect(growth(severalOpenRuns, 15_000)).toBeLessThan(10);
  });
});
