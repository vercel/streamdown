import remend from "remend";
import { describe, expect, it } from "vitest";
import {
  hasFootnoteDefinition,
  hasFootnoteReference,
  hasLinkDefinition,
  parseMarkdownIntoBlocks,
} from "../lib/parse-blocks";
import {
  advanceStableLength,
  repairStream,
  type StreamRepairState,
} from "../lib/stream-repair";

// The full-document patterns that the incremental checks replace.
const footnoteReferencePattern = /\[\^[\w-]{1,200}\](?!:)/;
const footnoteDefinitionPattern = /\[\^[\w-]{1,200}\]:/;
const linkDefinitionPattern = /^ {0,3}\[[^\]]+\]:/m;

// Streamed as Streamdown does: repair, split into blocks, advance. Every
// repaired prefix must equal remend over the whole prefix.
const documents = [
  "# Title\n\nFirst paragraph with **bold** and *italic*.\n\nSecond with a [link](https://example.com) and `code`.\n\nThird **unfinished",
  "Intro\n\n- one **a**\n- two [b](/b)\n\n  continued\n\n1. first\n2. second *em*\n\nAfter the list `x`\n",
  "| a | b |\n| --- | --- |\n| **x** | [y](/y) |\n| 3 | 4 |\n\nText after the table with ~~strike~~.\n",
  "Before\n\n```ts\nconst a = '**';\n\nconst b = `x`;\n```\n\nAfter the fence with **bold\n\nand more",
  "Math $x$ and\n\n$$\na = b\n\n= c\n$$\n\nThen `inline` and **strong**.\n",
  "> quote with *em*\n> more\n\nSetext\n===\n\npara\n---\n\nend [unfinished link",
  "Call foo(**kwargs) to forward.\n\nGlob src/**/test.js.\n\nThe next paragraph *streams* on.\n",
  "See [ref] here.\n\n[ref]: https://example.com\n\nFootnote[^1] text.\n\n[^1]: note\n",
  // A closer appended at the end must not make an earlier open block final.
  "Before\n\n$$\nx = 1\n\ny **2\n\nstill math\n$$\n\nafter *em*\n",
  "Text [a\n\nb](https://exa\n\nc **d\n\ne",
];

const chunked = (text: string, seed: number): string[] => {
  const chunks: string[] = [];
  let state = seed;
  for (let index = 0; index < text.length; ) {
    state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
    const size = 1 + (state % 4);
    chunks.push(text.slice(index, index + size));
    index += size;
  }
  return chunks;
};

// Returns each input whose tail repair differs from a full repair.
const stream = (inputs: string[]) => {
  let state: StreamRepairState | null = null;
  const mismatches: string[] = [];
  for (const input of inputs) {
    state = repairStream(state, input, undefined);
    if (state.repaired !== remend(input)) {
      mismatches.push(input);
    }
    advanceStableLength(state, parseMarkdownIntoBlocks(state.repaired));
  }
  return { state, mismatches };
};

describe("tail-bounded stream repair", () => {
  it("matches a full repair at every prefix", () => {
    for (const document of documents) {
      for (const seed of [1, 2, 3]) {
        let text = "";
        const inputs = chunked(document, seed).map((chunk) => {
          text += chunk;
          return text;
        });
        expect(stream(inputs).mismatches).toEqual([]);
      }
    }
  });

  it("skips the settled prefix once later blocks exist", () => {
    const { state } = stream([
      "One.\n\nTwo.\n\nThree.\n\nFour",
      "One.\n\nTwo.\n\nThree.\n\nFour and",
    ]);
    expect(state?.stableLength).toBeGreaterThan(0);
  });

  it("repairs the whole input after a rewrite, CR input, or new options", () => {
    let { state } = stream(["One.\n\nTwo.\n\nThree.\n\nFour **x"]);
    state = repairStream(state, "Different **text", undefined);
    expect(state.stableLength).toBe(0);
    expect(state.repaired).toBe(remend("Different **text"));

    state = repairStream(state, "Different **text\r\nmore", undefined);
    expect(state.stableLength).toBe(0);

    const options = { links: false };
    state = repairStream(state, "Different **text\r\nmore [x", options);
    expect(state.repaired).toBe(remend("Different **text\r\nmore [x", options));
  });
});

describe("incremental footnote and link-definition checks", () => {
  // Parsing an unrelated document first resets each check's memo, so the
  // second call is a full check of that prefix.
  const fresh = (input: string): string[] => {
    parseMarkdownIntoBlocks("unrelated reset document\n");
    return parseMarkdownIntoBlocks(input);
  };

  it("matches a full check at every prefix", () => {
    const label = "x".repeat(200);
    const inputs = [
      "Intro paragraph.\n\nSee note [^1] here.\n\nMore text.\n",
      "Intro.\n\nText [^a]: is a definition.\n\nMore.\n",
      `Intro.\n\nLong [^${label}] label.\n\nMore [^${label}x] too long.\n`,
      "Intro [x](/u).\n\nThen\n[ref]: https://example.com\n\nafter\n",
      "a ] b\n\n[multi\nline]: /u\n\nend\n",
      "> [q]: /quoted\n\npara\n",
    ];
    for (const document of inputs) {
      for (const seed of [1, 2]) {
        let text = "";
        for (const chunk of chunked(document, seed)) {
          text += chunk;
          const expected = fresh(text);
          parseMarkdownIntoBlocks(text.slice(0, -chunk.length) || " ");
          expect(parseMarkdownIntoBlocks(text)).toEqual(expected);
        }
      }
    }
  });

  it("gives each check the same answer as its full regex", () => {
    const checks = [
      [hasFootnoteReference, footnoteReferencePattern],
      [hasFootnoteDefinition, footnoteDefinitionPattern],
      [hasLinkDefinition, linkDefinitionPattern],
    ] as const;
    const pieces = [
      "[",
      "]",
      "^",
      ":",
      "-",
      "a",
      " ",
      "\n",
      "\n\n",
      "[^n]",
      "]:",
      "[x]: /u",
    ];
    let state = 7717;
    for (let run = 0; run < 300; run += 1) {
      let text = "";
      for (let step = 0; step < 80; step += 1) {
        state = (state * 1_103_515_245 + 12_345) % 2_147_483_648;
        text += pieces[state % pieces.length];
        for (const [check, pattern] of checks) {
          expect(check(text)).toBe(pattern.test(text));
        }
      }
    }
  });
});
