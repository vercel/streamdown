import type { BundledLanguage, TokensResult } from "shiki";
import { createHighlighter } from "shiki";
import { createJavaScriptRegexEngine } from "shiki/engine/javascript";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { createCodePlugin, type HighlightResult } from "../index";

// Record every code string the highlighter tokenizes so the tests can pin
// how much work a streamed block costs.
const tokenized: string[] = [];

vi.mock("shiki", async (importOriginal) => {
  const shiki = await importOriginal<typeof import("shiki")>();
  return {
    ...shiki,
    createHighlighter: async (
      ...args: Parameters<typeof shiki.createHighlighter>
    ) => {
      const highlighter = await shiki.createHighlighter(...args);
      const codeToTokens = highlighter.codeToTokens.bind(highlighter);
      highlighter.codeToTokens = (code, options) => {
        tokenized.push(code);
        return codeToTokens(code, options);
      };
      return highlighter;
    },
  };
});

const THEMES: ["github-light", "github-dark"] = ["github-light", "github-dark"];

const SAMPLE = `/**
 * Streams items in batches.
 */
export async function* batches<T>(items: readonly T[], size = 8) {
  const label = \`batch of \${size}
  items\`; // template spans two lines
  for (let i = 0; i < items.length; i += size) {
    /* block comment
       across lines */
    yield { label, chunk: items.slice(i, i + size) };
  }

  return "done";
}
`.trimEnd();

const PYTHON = `def batches(items, size=8):
    """Yield items in batches."""
    for i in range(0, len(items), size):
        yield items[i : i + size]
`.trimEnd();

type Language = "python" | "typescript";

const plugin = createCodePlugin({ themes: THEMES });

const highlight = (code: string, language: string) =>
  new Promise<HighlightResult>((resolve) => {
    const cached = plugin.highlight(
      { code, language: language as BundledLanguage, themes: THEMES },
      resolve
    );
    if (cached) {
      resolve(cached);
    }
  });

const comparable = (result: TokensResult) => ({
  bg: result.bg,
  fg: result.fg,
  rootStyle: result.rootStyle,
  themeName: result.themeName,
  tokens: result.tokens,
});

let reference: Awaited<ReturnType<typeof createHighlighter>>;

// The plugin result and a fresh full tokenization of the same code.
const both = async (code: string, language: Language) => {
  const expected = reference.codeToTokens(code, {
    lang: language,
    themes: { light: THEMES[0], dark: THEMES[1] },
  });
  const actual = await highlight(code, language);
  return [comparable(actual), comparable(expected)];
};

const steps = (code: string, step: number): string[] => {
  const result: string[] = [];
  for (let end = step; end < code.length + step; end += step) {
    result.push(code.slice(0, end));
  }
  return result;
};

beforeAll(async () => {
  reference = await createHighlighter({
    themes: THEMES,
    langs: ["typescript", "python"],
    engine: createJavaScriptRegexEngine({ forgiving: true }),
  });
});

describe("incremental highlighting", () => {
  it("matches a full tokenization at every streaming step", async () => {
    for (const partial of steps(SAMPLE, 7)) {
      const [actual, expected] = await both(partial, "typescript");
      expect(actual).toEqual(expected);
    }
  });

  it("tokenizes only new lines while a block streams", async () => {
    const code = Array.from({ length: 12 }, (_, i) =>
      SAMPLE.replaceAll("batches", `batches${i}`)
    ).join("\n\n");
    const partials = steps(code, 24);
    const longestLine = Math.max(
      ...code.split("\n").map((line) => line.length)
    );

    tokenized.length = 0;
    for (const partial of partials) {
      await highlight(partial, "typescript");
    }
    const chars = tokenized.reduce((sum, chunk) => sum + chunk.length, 0);

    // Each completed line is tokenized once; each step re-tokenizes at most
    // the trailing partial line.
    expect(chars).toBeLessThanOrEqual(
      code.length + partials.length * longestLine
    );
    // A full re-tokenization per step would cost the sum of all step lengths.
    const full = partials.reduce((sum, partial) => sum + partial.length, 0);
    expect(chars).toBeLessThan(full / 10);
  });

  it("keeps the incremental state of blocks that stream at the same time", async () => {
    const stream = (names: string[]) =>
      names.map((name) => steps(SAMPLE.replaceAll("batches", name), 24));
    // Round-robin: each request extends a different block than the last one.
    const interleave = async (
      partials: string[][],
      request: (code: string) => Promise<unknown>
    ) => {
      for (let i = 0; i < partials[0].length; i++) {
        for (const list of partials) {
          if (i < list.length) {
            await request(list[i]);
          }
        }
      }
    };

    await interleave(stream(["alpha", "beta", "gamma"]), async (code) => {
      const [actual, expected] = await both(code, "typescript");
      expect(actual).toEqual(expected);
    });

    const partials = stream(["delta", "epsilon", "zeta"]);
    const finals = partials.map((list) => list.at(-1) as string);
    const longestLine = Math.max(
      ...finals.flatMap((code) => code.split("\n").map((line) => line.length))
    );
    const stepCount = partials.reduce((sum, list) => sum + list.length, 0);
    tokenized.length = 0;
    await interleave(partials, (code) => highlight(code, "typescript"));
    const chars = tokenized.reduce((sum, chunk) => sum + chunk.length, 0);
    const total = finals.reduce((sum, code) => sum + code.length, 0);
    expect(chars).toBeLessThanOrEqual(total + stepCount * longestLine);
  });

  it("handles code that does not extend the previous request", async () => {
    await highlight(SAMPLE, "typescript");
    const cases = [
      // An earlier line changed, so the prefix no longer matches.
      SAMPLE.replace("size = 8", "size = 16"),
      // Shorter than the previous request.
      SAMPLE.slice(0, 40),
      // Unrelated code.
      "const answer = 42;",
    ];
    for (const code of cases) {
      const [actual, expected] = await both(code, "typescript");
      expect(actual).toEqual(expected);
    }
  });

  it("handles language aliases and language switches mid-stream", async () => {
    const head = PYTHON.slice(0, 30);
    const sequence: [string, string, Language][] = [
      [head, "py", "python"],
      [PYTHON, "python", "python"],
      // Same text, different grammar: must not reuse the python rows.
      [PYTHON, "typescript", "typescript"],
      [head, "typescript", "typescript"],
      [PYTHON, "python", "python"],
    ];
    for (const [code, requested, resolved] of sequence) {
      await highlight(code, requested);
      const [actual, expected] = await both(code, resolved);
      expect(actual).toEqual(expected);
    }
  });

  it("handles edge-case line structures", async () => {
    const cases = [
      "",
      "const one = 1;",
      "\n",
      "const a = 1;\n\n\nconst b = 2;\n",
      ...steps("const a = 1;\r\nconst b = `x\r\ny`;\r\nconst c = 3;", 5),
    ];
    for (const code of cases) {
      const [actual, expected] = await both(code, "typescript");
      expect(actual).toEqual(expected);
    }
  });

  it("keeps token offsets relative to the whole code", async () => {
    const code = "const a = 1;\nconst b = 2;\nconst c = 3;";
    await highlight(code.slice(0, 15), "typescript");
    const result = await highlight(code, "typescript");
    const rebuilt = result.tokens
      .map((row) =>
        row
          .map((token) =>
            code.slice(token.offset, token.offset + token.content.length)
          )
          .join("")
      )
      .join("\n");
    expect(rebuilt).toBe(code);
  });
});
