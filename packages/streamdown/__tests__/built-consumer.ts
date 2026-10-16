import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { pathToFileURL } from "node:url";

// Bundles an app that imports only `Streamdown` from the built package with
// esbuild (through tsup, with code splitting) and splits what it produced into
// the code the app loads up front and the code only import() reaches. The
// build runs in a child Node process, outside the test's DOM environment.
// Needs `pnpm build` first.

const distEntry = path.resolve(import.meta.dirname, "../dist/index.js");
const tsupEntry = createRequire(import.meta.url).resolve("tsup");

interface MetafileOutput {
  entryPoint?: string;
  imports: { external?: boolean; kind: string; path: string }[];
}

export interface ConsumerBundle {
  deferred: string;
  upFront: string;
}

const reachable = (
  outputs: Record<string, MetafileOutput>,
  roots: string[],
  kind: string
): string[] => {
  const seen = new Set<string>();
  const pending = [...roots];
  while (pending.length > 0) {
    const file = pending.pop();
    if (file === undefined || seen.has(file)) {
      continue;
    }
    seen.add(file);
    for (const imported of outputs[file]?.imports ?? []) {
      if (!imported.external && imported.kind === kind) {
        pending.push(imported.path);
      }
    }
  }
  return [...seen];
};

export const bundleConsumer = (workDir: string): ConsumerBundle => {
  if (!existsSync(distEntry)) {
    throw new Error("Build the package before running this test: pnpm build");
  }
  writeFileSync(
    path.join(workDir, "app.ts"),
    `import { Streamdown } from ${JSON.stringify(distEntry)};\nexport { Streamdown };\n`
  );
  writeFileSync(
    path.join(workDir, "build.mjs"),
    `import { build } from ${JSON.stringify(pathToFileURL(tsupEntry).href)};
await build({
  entry: { app: "app.ts" },
  external: [/^[^./]/],
  format: ["esm"],
  metafile: true,
  outDir: "out",
  silent: true,
  splitting: true,
});
`
  );
  execFileSync(process.execPath, ["build.mjs"], {
    cwd: workDir,
    stdio: "pipe",
  });

  const { outputs } = JSON.parse(
    readFileSync(path.join(workDir, "out", "metafile-esm.json"), "utf8")
  ) as { outputs: Record<string, MetafileOutput> };
  const entryOutput = Object.keys(outputs).find((file) =>
    outputs[file].entryPoint?.endsWith("app.ts")
  );
  if (entryOutput === undefined) {
    throw new Error("the consumer build produced no entry output");
  }
  const upFrontFiles = reachable(outputs, [entryOutput], "import-statement");
  const dynamicRoots = upFrontFiles.flatMap((file) =>
    outputs[file].imports
      .filter((imported) => imported.kind === "dynamic-import")
      .map((imported) => imported.path)
  );
  const deferredFiles = reachable(
    outputs,
    dynamicRoots,
    "import-statement"
  ).filter((file) => !upFrontFiles.includes(file));
  const read = (files: string[]) =>
    files
      .map((file) => readFileSync(path.resolve(workDir, file), "utf8"))
      .join("\n");
  return { deferred: read(deferredFiles), upFront: read(upFrontFiles) };
};
