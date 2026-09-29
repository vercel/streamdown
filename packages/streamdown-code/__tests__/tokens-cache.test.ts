import type { BundledLanguage } from "shiki";
import { afterEach, describe, expect, it, vi } from "vitest";
import { createCodePlugin, type HighlightResult } from "../index";

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
        return codeToTokens(code, options);
      };
      return highlighter;
    },
  };
});

const THEMES: ["github-light", "github-dark"] = ["github-light", "github-dark"];

// The cache is module level, so each test uses code no other test uses.
const plugin = createCodePlugin({ themes: THEMES });

const request = (code: string, language = "typescript") => ({
  code,
  language: language as BundledLanguage,
  themes: THEMES,
});

const highlight = (code: string, language?: string) =>
  new Promise<HighlightResult>((resolve) => {
    const cached = plugin.highlight(request(code, language), resolve);
    if (cached) {
      resolve(cached);
    }
  });

// Note: a miss also starts highlighting that code in the background
const cachedResult = (code: string, language?: string) =>
  plugin.highlight(request(code, language));

const text = (result: HighlightResult) =>
  result.tokens
    .map((row) => row.map((token) => token.content).join(""))
    .join("\n");

// A block of `lines` distinct lines, well over 200 characters
const block = (name: string, lines = 12) =>
  Array.from(
    { length: lines },
    (_, i) => `const ${name}_${i} = compute("${name}", ${i}); // line ${i}`
  ).join("\n");

// The same code with one character in the middle changed
const variant = (code: string) => {
  const middle = Math.floor(code.length / 2);
  return `${code.slice(0, middle)}X${code.slice(middle + 1)}`;
};

// Streams `full` in steps of `size` characters, waiting for each result
const stream = async (full: string, size: number, language?: string) => {
  const steps: string[] = [];
  for (let end = size; end < full.length; end += size) {
    steps.push(full.slice(0, end));
  }
  steps.push(full);
  for (const step of steps) {
    await highlight(step, language);
  }
  return steps;
};

// Requests enough unrelated blocks that earlier blocks are no longer
// tracked as streaming, so their replaced results are gone
const flushReplaced = async (name: string) => {
  for (let i = 0; i < 5; i++) {
    await highlight(block(`${name}-${i}`, 2));
  }
};
// Let highlighting started by a miss finish before the next test
afterEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, 0));
});

describe("tokens cache", () => {
  it("returns the result of the code it was asked for", async () => {
    const first = block("exact");
    const second = variant(first);

    expect(text(await highlight(first))).toBe(first);
    expect(text(await highlight(second))).toBe(second);
    const cached = cachedResult(first);
    expect(cached === null || text(cached) === first).toBe(true);
    expect(text(cachedResult(second) as HighlightResult)).toBe(second);
  });

  it("gives each pending request the result of its own code", async () => {
    const first = block("pending");
    const second = variant(first);

    const [a, b] = await Promise.all([highlight(first), highlight(second)]);
    expect(text(a)).toBe(first);
    expect(text(b)).toBe(second);
  });

  it("keeps the final result of a streamed block but not every step", async () => {
    const full = block("streamed", 30);
    const steps = await stream(full, 7);

    expect(text(cachedResult(full) as HighlightResult)).toBe(full);
    // Only the last few replaced steps are kept, in case the stream steps back
    for (const step of steps.slice(0, -6)) {
      expect(cachedResult(step)).toBeNull();
    }
  });

  it("keeps only the final results of blocks that stream at the same time", async () => {
    const first = block("together-a", 10);
    const second = block("together-b", 10);
    const steps: [string, string][] = [];
    for (let end = 9; end < first.length + 9; end += 9) {
      steps.push([first.slice(0, end), second.slice(0, end)]);
    }
    // Both blocks request each update in the same render, as effects do
    for (const [a, b] of steps) {
      await Promise.all([highlight(a), highlight(b)]);
    }

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
    expect(text(cachedResult(second) as HighlightResult)).toBe(second);
    // Each block keeps its last few replaced results
    for (const [a, b] of steps.slice(0, -5)) {
      expect(cachedResult(a)).toBeNull();
      expect(cachedResult(b)).toBeNull();
    }
  });

  it("keeps the result when the closing fence arrives in pieces", async () => {
    const full = block("fenced", 8);
    await stream(full, 9);
    // The fence text is part of the code until the fence is complete
    await highlight(`${full}\n\``);
    await highlight(`${full}\n\`\``);

    expect(text(cachedResult(full) as HighlightResult)).toBe(full);
    // The fence text it stepped back from is not kept
    await flushReplaced("flush-fenced");
    expect(cachedResult(`${full}\n\`\``)).toBeNull();
  });

  it("keeps the results of blocks whose fences close together", async () => {
    const fulls = ["a", "b", "c", "d"].map((name) =>
      block(`closing-${name}`, 6)
    );
    const run = (codes: string[]) =>
      Promise.all(codes.map((c) => highlight(c)));
    for (let end = 9; end < fulls[0].length; end += 9) {
      await run(fulls.map((full) => full.slice(0, end)));
    }
    await run(fulls);
    await run(fulls.map((full) => `${full}\n\``));
    await run(fulls.map((full) => `${full}\n\`\``));

    for (const full of fulls) {
      expect(text(cachedResult(full) as HighlightResult)).toBe(full);
    }
  });

  it("keeps a finished block when a later block repeats and extends it", async () => {
    const first = block("repeated");
    await highlight(first);
    await stream(`${first}\nconst added = true;`, 9);
    await flushReplaced("flush-repeated");

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
  });

  it("keeps a streamed block when a later streamed block repeats and extends it", async () => {
    // The later block passes through the same steps as the first one
    const first = block("replayed");
    await stream(first, 9);
    await stream(`${first}\nconst added = true;`, 9);
    await flushReplaced("flush-replayed");

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
  });

  it("keeps a block that a later block repeats and extends in one request", async () => {
    // As when a chat history loads: each block is requested once
    const first = block("history");
    await highlight(first);
    await highlight(`${first}\nconst added = true;`);
    await flushReplaced("flush-history");

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
  });

  it("shows the last requested code when requests finish together", async () => {
    // The highlighter for this language is not loaded yet, so all requests
    // of the closing fence are pending at once, as in a first render
    const code = "gem install streamdown";
    let shown: HighlightResult | undefined;
    const show = (result: HighlightResult) => {
      shown = result;
    };
    for (const step of [code, `${code}\n\``, `${code}\n\`\``, code]) {
      plugin.highlight(request(step, "ruby"), show);
    }
    await vi.waitFor(() => expect(shown).toBeDefined());
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(text(shown as HighlightResult)).toBe(code);
  });

  it("keeps a result that the next request does not extend", async () => {
    const first = block("kept");
    const other = block("other");
    await highlight(first);
    await highlight(other);
    await flushReplaced("flush-kept");

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
    expect(text(cachedResult(other) as HighlightResult)).toBe(other);
  });

  it("keeps a result when the last line changes instead of growing", async () => {
    const first = "const a = 1;\nconst foo";
    await highlight(first);
    await highlight("const a = 1;\nconst bar = 2");
    await flushReplaced("flush-edited");

    expect(text(cachedResult(first) as HighlightResult)).toBe(first);
  });

  it("drops the oldest results past the cache size limit", async () => {
    // Plain text keeps the tokenization cheap; 11 codes of 200,000 characters
    // go past the 2,000,000 character limit by one
    const language = "plaintext-limit";
    const codes = Array.from({ length: 11 }, (_, i) =>
      `${i}`.padEnd(200_000, `line ${i}\n`)
    );
    for (const code of codes) {
      await highlight(code, language);
    }

    for (const code of codes.slice(1)) {
      expect(cachedResult(code, language)).not.toBeNull();
    }
    expect(cachedResult(codes[0], language)).toBeNull();
  });

  it("caches unknown languages as plain text", async () => {
    const code = block("unknown");
    await highlight(code, "not-a-language-1");

    expect(cachedResult(code, "not-a-language-2")).not.toBeNull();
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

    // A later request for the same code calls only its own callback
    expect(text(await highlight(code))).toBe(code);
    expect(callback).not.toHaveBeenCalled();
  });
});
