import type { BundledLanguage } from "shiki";
import { test } from "vitest";
import { createCodePlugin, type HighlightResult } from "../index";

const THEMES: ["github-light", "github-dark"] = ["github-light", "github-dark"];

const UNIT = `/** Handler N: validates and transforms a batch of items. */
export async function handlerN(items: readonly Item[], opts: Options = {}): Promise<Result<N>> {
  const limit = opts.limit ?? N;
  const out: Result<N>[] = [];
  for (const item of items.slice(0, limit)) {
    if (!item.id || item.tags.includes("skip-N")) { continue; }
    const value = \`\${item.name}-N\`.replace(/[^a-z0-9-]/gi, "_");
    out.push({ id: item.id, value, score: Math.round(item.weight * N.5) });
  }
  return { ok: true, data: out } as Result<N>;
}`;

const document = (units: number) =>
  Array.from({ length: units }, (_, i) => UNIT.replaceAll("N", String(i))).join(
    "\n\n"
  );

const SMALL = document(2);
const LARGE = document(12);

const plugin = createCodePlugin({ themes: THEMES });

const highlight = (code: string) =>
  new Promise<HighlightResult>((resolve) => {
    const cached = plugin.highlight(
      { code, language: "typescript" as BundledLanguage, themes: THEMES },
      resolve
    );
    if (cached) {
      resolve(cached);
    }
  });

// Every run streams a distinct document so no step hits the token cache.
let run = 0;

const stream = async (code: string, step: number) => {
  run += 1;
  const text = `// run ${run}\n${code}`;
  for (let end = step; end < text.length + step; end += step) {
    await highlight(text.slice(0, end));
  }
};

test("highlight while streaming", async ({ bench }) => {
  // Load the grammar and themes before timing.
  await highlight("const warm = true;");

  await bench(
    `large block (${LARGE.split("\n").length} lines), complete`,
    () => {
      run += 1;
      return highlight(`// run ${run}\n${LARGE}`);
    }
  ).run();

  await bench(
    `small block (${SMALL.split("\n").length} lines), 24-char steps`,
    () => stream(SMALL, 24)
  ).run();

  await bench(
    `large block (${LARGE.split("\n").length} lines), 24-char steps`,
    () => stream(LARGE, 24)
  ).run();

  await bench(
    `small block (${SMALL.split("\n").length} lines), 4-char steps`,
    () => stream(SMALL, 4)
  ).run();
  // A build that re-tokenizes the whole block on every step takes minutes
  // here, well past the default test timeout.
}, 600_000);
