import fc from "fast-check";
import { fromMarkdown } from "mdast-util-from-markdown";
import { describe, expect, it } from "vitest";
import remend from "../src";

// A streaming consumer feeds every prefix of a document through remend, so
// these tests assemble documents from COMPLETE constructs and derive all
// truncation from the streaming cut. The atoms deliberately include
// identifiers with double-underscore runs (snake__case style), which look
// like emphasis delimiters to a context-free counter.

const INLINE_ATOMS = [
  "plain words",
  "**bold text**",
  "*italic text*",
  "_underscore italic_",
  "__strong text__",
  "___strong italic___",
  "~~struck text~~",
  "`inline code`",
  "``double `tick` span``",
  "snake__case",
  "user__id",
  "a_b_c",
  "[label](https://example.com)",
  "![alt](https://example.com/pic.png)",
  "<b>tag</b>",
  "value is 20~25 degrees",
];

const BLOCK_ATOMS = [
  "# heading",
  "> a quote",
  "- item one\n- item two",
  "```js\nconst total__count = 1;\n```",
  "~~~\ntilde fenced\n~~~",
  "$$\nx^2\n$$",
];

// The longest fragment healing may legitimately drop: an incomplete
// construct cut mid-stream is at most one atom long, plus the stripped
// trailing space
const MAX_LOSS =
  Math.max(...[...INLINE_ATOMS, ...BLOCK_ATOMS].map((a) => a.length)) + 2;

// Length of the longest prefix of `input` that appears as a subsequence of
// `output`. Healing may insert characters (closers, escapes) and drop a
// trailing fragment, so authored text is preserved exactly when everything
// except a bounded tail survives as a subsequence.
const preservedPrefixLength = (input: string, output: string): number => {
  let matched = 0;
  for (let i = 0; i < output.length && matched < input.length; i += 1) {
    if (output[i] === input[matched]) {
      matched += 1;
    }
  }
  return matched;
};

interface CodeNode {
  lang?: string | null;
  meta?: string | null;
  type: string;
  value: string;
}

interface MdastNode {
  children?: MdastNode[];
  lang?: string | null;
  meta?: string | null;
  type: string;
  value?: string;
}

// A CommonMark parser is the oracle for what is code, including fences nested
// in block quotes and list items that a line-based scan can miss
const codeNodes = (markdown: string): CodeNode[] => {
  const found: CodeNode[] = [];
  const visit = (node: MdastNode): void => {
    if (node.type === "code" || node.type === "inlineCode") {
      found.push({
        type: node.type,
        value: node.value ?? "",
        lang: node.lang,
        meta: node.meta,
      });
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(fromMarkdown(markdown));
  return found;
};

const sameCode = (a: CodeNode, b: CodeNode): boolean =>
  a.type === b.type &&
  a.value === b.value &&
  a.lang === b.lang &&
  a.meta === b.meta;

// Healing must never change code. Every code block and span the parser finds
// in the prefix survives unchanged, with two exceptions at the end of the
// text. Healing strips trailing whitespace, which may trim the last node. And
// closing an open span absorbs the spans the prefix read inside it: in
// ``a `b` the prefix holds the span `b`, which closing `` swallows.
const assertCodeUnchanged = (prefix: string, healed: string): void => {
  const before = codeNodes(prefix);
  const after = codeNodes(healed);

  let common = 0;
  while (
    common < before.length &&
    common < after.length &&
    sameCode(before[common], after[common])
  ) {
    common += 1;
  }
  const last = before.at(-1);
  if (
    common === before.length - 1 &&
    common === after.length - 1 &&
    last &&
    sameCode({ ...last, value: last.value.trimEnd() }, after[common])
  ) {
    return;
  }

  const lost = before.slice(common);
  const added = after.slice(common);
  const closedSpan =
    added.length === 1 &&
    added[0].type === "inlineCode" &&
    lost.every(
      (node) =>
        node.type === "inlineCode" && added[0].value.includes(node.value)
    );
  if (added.length === 0 && lost.length === 0) {
    return;
  }
  if (!closedSpan) {
    throw new Error(
      `healing changed code: ${JSON.stringify(prefix)} -> ${JSON.stringify(healed)}\n` +
        `lost: ${JSON.stringify(lost)}\nadded: ${JSON.stringify(added)}`
    );
  }
};

const assertStreamingSafe = (prefix: string): void => {
  const healed = remend(prefix);
  assertCodeUnchanged(prefix, healed);

  const loss = prefix.length - preservedPrefixLength(prefix, healed);
  if (loss > MAX_LOSS) {
    throw new Error(
      `healing dropped ${loss} chars of ${JSON.stringify(prefix)} -> ${JSON.stringify(healed)}`
    );
  }

  const rehealed = remend(healed);
  if (rehealed !== healed) {
    throw new Error(
      `healing is not idempotent: ${JSON.stringify(prefix)} -> ${JSON.stringify(healed)} -> ${JSON.stringify(rehealed)}`
    );
  }
};

// A document is a sequence of atoms. Inline atoms join with spaces into
// paragraphs, block atoms stand alone, and everything joins with blank lines
// so fences and headings begin at a line start.
const documentArbitrary = fc
  .array(
    fc.oneof(
      { weight: 3, arbitrary: fc.subarray(INLINE_ATOMS, { minLength: 1 }) },
      { weight: 1, arbitrary: fc.constantFrom(...BLOCK_ATOMS).map((a) => [a]) }
    ),
    { minLength: 1, maxLength: 6 }
  )
  .map((groups) => groups.map((atoms) => atoms.join(" ")).join("\n\n"));

// Container blocks shift where a line's content starts, so every construct
// must behave the same once its lines carry a quote marker or list indent
const prefixLines =
  (first: string, rest: string, blank: string) =>
  (doc: string): string =>
    doc
      .split("\n")
      .map((line, index) => {
        if (index === 0) {
          return first + line;
        }
        return line ? rest + line : blank;
      })
      .join("\n");

const CONTAINERS = {
  quote: prefixLines("> ", "> ", ">"),
  tightQuote: prefixLines(">", ">", ">"),
  bullet: prefixLines("- ", "  ", ""),
  ordered: prefixLines("1. ", "   ", ""),
};

const containerNames = Object.keys(CONTAINERS) as (keyof typeof CONTAINERS)[];

const containedArbitrary = (docArbitrary: fc.Arbitrary<string>) =>
  fc
    .tuple(
      docArbitrary,
      fc.array(fc.constantFrom(...containerNames), {
        minLength: 1,
        maxLength: 2,
      })
    )
    .map(([doc, names]) =>
      names.reduce((wrapped, name) => CONTAINERS[name](wrapped), doc)
    );

describe("streaming properties", () => {
  it("preserves authored text and re-heals to itself on every cut", () => {
    fc.assert(
      fc.property(documentArbitrary, fc.nat(), (doc, cutSeed) => {
        const cut = cutSeed % (doc.length + 1);
        assertStreamingSafe(doc.slice(0, cut));
      }),
      { numRuns: 2000 }
    );
  });

  it("preserves authored text and code on every cut inside containers", () => {
    fc.assert(
      fc.property(
        containedArbitrary(documentArbitrary),
        fc.nat(),
        (doc, cutSeed) => {
          const cut = cutSeed % (doc.length + 1);
          assertStreamingSafe(doc.slice(0, cut));
        }
      ),
      { numRuns: 2000 }
    );
  });

  it("does not modify complete documents", () => {
    // Escape-oriented handlers (comparison operators, single tilde between
    // digits) intentionally rewrite complete text, so their trigger shapes
    // are excluded here
    const noOpAtoms = INLINE_ATOMS.filter((atom) => !atom.includes("20~25"));
    const noOpDocArbitrary = fc
      .array(
        fc.oneof(
          { weight: 3, arbitrary: fc.subarray(noOpAtoms, { minLength: 1 }) },
          {
            weight: 1,
            arbitrary: fc.constantFrom(...BLOCK_ATOMS).map((a) => [a]),
          }
        ),
        { minLength: 1, maxLength: 6 }
      )
      .map((groups) => groups.map((atoms) => atoms.join(" ")).join("\n\n"));

    fc.assert(
      fc.property(noOpDocArbitrary, (doc) => {
        expect(remend(doc)).toBe(doc);
      }),
      { numRuns: 1000 }
    );
  });
});

describe("exhaustive prefix sweep", () => {
  // Every prefix of a fixed corpus, deterministically. The corpus mixes
  // constructs that interact.
  const corpus = [
    "Use snake__case for names and __bold text__ throughout.",
    "The `obj__attr` field pairs with **bold** and _italic_ text.",
    "```python\ndef f():\n    return a__b\n```\n\nAfter the fence __open",
    "~~~\ntilde __fence\n~~~\n\n~~struck~~ and more",
    "A [link](https://example.com) and ![img](https://example.com/a.png) done.",
    "Math $$\nx^2 + y^2\n$$ and `code` mixed with ___strong italic___.",
    "| a | b |\n| - | - |\n| 1 | 2 |\n\nTable then **bold**",
    "Nested **bold with *italic* inside** plus ``double `tick` span``.",
  ];

  it("preserves authored text and re-heals to itself on every prefix", () => {
    for (const doc of corpus) {
      for (let cut = 0; cut <= doc.length; cut += 1) {
        assertStreamingSafe(doc.slice(0, cut));
      }
    }
  });
});
