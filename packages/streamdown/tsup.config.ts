import { fileURLToPath } from "node:url";
import { defineConfig } from "tsup";

const base = {
  dts: true,
  format: ["esm"] as ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom"],
  treeshake: true,
  splitting: true,
  platform: "browser" as const,
};

const DEFAULT_RAW_FILTER = /default-raw$/;
const defaultRaw = fileURLToPath(
  new URL("lib/default-raw.ts", import.meta.url)
);
const defaultRawCore = fileURLToPath(
  new URL("lib/default-raw.core.ts", import.meta.url)
);

export default defineConfig([
  { ...base, entry: ["index.tsx"] },
  {
    ...base,
    clean: false,
    entry: { core: "core.ts" },
    // Swap the rehype-raw import for a stub in the `streamdown/core` build.
    esbuildPlugins: [
      {
        name: "streamdown-core-no-raw",
        setup(build) {
          build.onResolve({ filter: DEFAULT_RAW_FILTER }, (args) => {
            const resolved = fileURLToPath(
              new URL(`${args.path}.ts`, `file://${args.resolveDir}/`)
            );
            return resolved === defaultRaw ? { path: defaultRawCore } : null;
          });
        },
      },
    ],
  },
]);
