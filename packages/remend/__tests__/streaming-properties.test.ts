import fc from "fast-check";
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

const assertStreamingSafe = (prefix: string): void => {
  const healed = remend(prefix);

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
  // constructs that interact: identifiers with double underscores next to
  // real emphasis, fences of both characters, spans with multi-backtick runs,
  // and half-typed closers.
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
