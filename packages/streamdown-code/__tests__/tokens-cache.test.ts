import type { BundledLanguage } from "shiki";
import { describe, expect, it, vi } from "vitest";
import { createCodePlugin, type HighlightResult } from "../index";

// Count tokenizations so the tests can tell a cache hit from a miss
let tokenizeCalls = 0;
// Lets a test make the next tokenization fail
let failNextTokenize = false;

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
        if (failNextTokenize) {
          failNextTokenize = false;
          throw new Error("tokenize failed");
        }
        tokenizeCalls++;
        return codeToTokens(code, options);
      };
      return highlighter;
    },
  };
});

const THEMES: ["github-light", "github-dark"] = ["github-light", "github-dark"];

// The cache is module level, so each test uses code no other test uses
const plugin = createCodePlugin({ themes: THEMES });

const request = (
  code: string,
  isIncomplete = false,
  language = "typescript"
) => ({
  code,
  isIncomplete,
  language: language as BundledLanguage,
  themes: THEMES,
});

const highlight = (code: string, isIncomplete = false, language?: string) =>
  new Promise<HighlightResult>((resolve) => {
    const cached = plugin.highlight(
      request(code, isIncomplete, language),
      resolve
    );
    if (cached) {
      resolve(cached);
    }
  });

/** Whether `code` is cached, without starting a background highlight */
const isCached = (code: string, isIncomplete = false, language?: string) => {
  const before = tokenizeCalls;
  const hit = plugin.highlight(request(code, isIncomplete, language)) !== null;
  return { hit, tokenized: () => tokenizeCalls > before };
};

const text = (result: HighlightResult) =>
  result.tokens
    .map((row) => row.map((token) => token.content).join(""))
    .join("\n");

const block = (name: string, lines = 12) =>
  Array.from(
    { length: lines },
    (_, i) => `const ${name}_${i} = compute("${name}", ${i}); // line ${i}`
  ).join("\n");

describe("tokens cache", () => {
  it("never returns the tokens of code that differs only in the middle", async () => {
    const first = block("middle");
    const middle = Math.floor(first.length / 2);
    const second = `${first.slice(0, middle)}X${first.slice(middle + 1)}`;

    expect(text(await highlight(first))).toBe(first);
    expect(text(await highlight(second))).toBe(second);
  });

  it("calls every callback, including for the same pending code", async () => {
    const code = block("pending");
    const [a, b] = await Promise.all([highlight(code), highlight(code)]);
    expect(text(a)).toBe(code);
    expect(b).toBe(a);
  });

  it("does not tokenize twice for requests that were pending together", async () => {
    const code = block("pending-once");
    const before = tokenizeCalls;
    await Promise.all([highlight(code), highlight(code), highlight(code)]);
    const once = tokenizeCalls - before;

    const other = block("pending-once-other");
    const beforeOther = tokenizeCalls;
    await highlight(other);
    expect(once).toBe(tokenizeCalls - beforeOther);
  });

  it("does not cache results of a streaming block", async () => {
    const full = block("streamed", 30);
    for (let end = 20; end < full.length; end += 20) {
      const step = full.slice(0, end);
      expect(text(await highlight(step, true))).toBe(step);
      expect(isCached(step, true).hit).toBe(false);
    }
  });

  it("caches a block once it completes", async () => {
    const full = block("completed");
    await highlight(full.slice(0, 50), true);
    await highlight(full);

    const { hit, tokenized } = isCached(full);
    expect(hit).toBe(true);
    expect(tokenized()).toBe(false);
  });

  it("keeps finished blocks after other blocks stream", async () => {
    const finished = block("finished");
    await highlight(finished);
    const streaming = block("busy", 40);
    for (let end = 10; end < streaming.length; end += 10) {
      await highlight(streaming.slice(0, end), true);
    }

    expect(isCached(finished).hit).toBe(true);
  });

  it("keeps every block of a chat with more than 200 blocks", async () => {
    // Switching back to a chat requests its blocks again, top to bottom
    const codes = Array.from({ length: 300 }, (_, i) => block(`chat-${i}`, 3));
    for (const code of codes) {
      await highlight(code);
    }

    const before = tokenizeCalls;
    const hits = codes.filter((code) => isCached(code).hit).length;
    expect(hits).toBe(codes.length);
    expect(tokenizeCalls).toBe(before);
  });

  it("evicts the least recently used blocks past the budget", async () => {
    // Plain text has one token per line, so each line costs two, plus one per
    // 64 characters of the block; ten blocks of 12,500 lines fit in the
    // budget, eleven do not
    const language = "text";
    const lines = (name: string, count: number) =>
      Array.from({ length: count }, (_, i) => `${name} ${i}`).join("\n");
    const codes = Array.from({ length: 10 }, (_, i) =>
      lines(`budget ${i}`, 12_500)
    );
    for (const code of codes) {
      await highlight(code, false, language);
    }
    // Using the oldest one makes the second one the least recently used
    expect(isCached(codes[0], false, language).hit).toBe(true);
    const added = lines("budget new", 12_500);
    await highlight(added, false, language);

    expect(isCached(added, false, language).hit).toBe(true);
    expect(isCached(codes[0], false, language).hit).toBe(true);
    for (const code of codes.slice(2)) {
      expect(isCached(code, false, language).hit).toBe(true);
    }
    // Checked last: a miss starts highlighting it again in the background
    expect(isCached(codes[1], false, language).hit).toBe(false);
  });

  it("evicts the least recently used block past 5,000 results", async () => {
    const language = "text";
    const codes = Array.from({ length: 5000 }, (_, i) => `result ${i}`);
    for (const code of codes) {
      await highlight(code, false, language);
    }
    expect(isCached(codes[0], false, language).hit).toBe(true);
    await highlight("result new", false, language);

    expect(isCached("result new", false, language).hit).toBe(true);
    expect(isCached(codes[0], false, language).hit).toBe(true);
    expect(isCached(codes[2], false, language).hit).toBe(true);
    // Checked last: a miss starts highlighting it again in the background
    expect(isCached(codes[1], false, language).hit).toBe(false);
  });

  it.each([
    [
      "many tokens",
      "text",
      Array.from({ length: 160_000 }, (_, i) => `token ${i}`).join("\n"),
    ],
    ["blank lines", "typescript", `// blank\n${"\n".repeat(310_000)}`],
    ["one long line", "text", "long ".padEnd(19_300_000, "x")],
  ])("keeps a block over the budget until the next result (%s)", async (_, language, oversized) => {
    await highlight(oversized, false, language);
    expect(isCached(oversized, false, language).hit).toBe(true);

    const next = `after ${oversized.length}`;
    await highlight(next, false, language);
    expect(isCached(next, false, language).hit).toBe(true);
    // Checked last: a miss starts highlighting it again in the background
    expect(isCached(oversized, false, language).hit).toBe(false);
  });

  it("caches unknown languages as plain text", async () => {
    const code = block("unknown");
    await highlight(code, false, "not-a-language-1");

    expect(isCached(code, false, "not-a-language-2").hit).toBe(true);
  });

  it("keeps a finished block when a later block repeats and extends it", async () => {
    const first = block("repeated");
    await highlight(first);
    const extended = `${first}\nconst added = true;`;
    for (let end = first.length; end < extended.length; end += 5) {
      await highlight(extended.slice(0, end), true);
    }
    await highlight(extended);

    expect(isCached(first).hit).toBe(true);
    expect(isCached(extended).hit).toBe(true);
  });

  it("keeps the results of blocks whose fences close together", async () => {
    const fulls = ["a", "b", "c", "d"].map((name) =>
      block(`closing-${name}`, 6)
    );
    const run = (codes: string[], isIncomplete: boolean) =>
      Promise.all(codes.map((c) => highlight(c, isIncomplete)));
    for (let end = 9; end < fulls[0].length; end += 9) {
      await run(
        fulls.map((full) => full.slice(0, end)),
        true
      );
    }
    await run(
      fulls.map((full) => `${full}\n\``),
      true
    );
    await run(fulls, false);

    for (const full of fulls) {
      expect(isCached(full).hit).toBe(true);
    }
  });

  it("calls each callback with its own code when requests finish together", async () => {
    // The highlighter for this language is not loaded yet, so all requests
    // of the closing fence are pending at once, as in a first render
    const code = "gem install streamdown";
    const shown: string[] = [];
    const steps = [code, `${code}\n\``, `${code}\n\`\``, code];
    await Promise.all(
      steps.map(
        (step, i) =>
          new Promise<void>((resolve) => {
            plugin.highlight(
              request(step, i < steps.length - 1, "ruby"),
              (result) => {
                shown.push(text(result));
                resolve();
              }
            );
          })
      )
    );

    expect(shown).toEqual(steps);
  });

  it("does not cache or notify a failed highlight", async () => {
    const code = block("failing");
    // Load the highlighter first so the failure hits the tokenization
    await highlight(block("warm"));
    const errors = vi.spyOn(console, "error").mockImplementation(() => {
      // Expected
    });
    const callback = vi.fn();

    failNextTokenize = true;
    expect(plugin.highlight(request(code), callback)).toBeNull();
    await vi.waitFor(() => expect(errors).toHaveBeenCalled());
    errors.mockRestore();

    // A later request for the same code tokenizes again and calls only its
    // own callback
    expect(text(await highlight(code))).toBe(code);
    expect(callback).not.toHaveBeenCalled();
  });
});
