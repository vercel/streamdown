import { defineConfig, type Options } from "tsup";

type EsbuildPlugin = NonNullable<Options["esbuildPlugins"]>[number];

// How lib/import-animation-engine.ts names the animate entry.
const ANIMATE_ENTRY_IMPORT = /^\.\.\/animate$/;

// The main bundle reaches the word fade only through import(): it loads the
// separately built dist/animate.js at runtime instead of bundling it, so no
// shared chunk ties the two together and bundlers can leave it out up front.
const loadAnimateEntryAtRuntime: EsbuildPlugin = {
  name: "load-animate-entry-at-runtime",
  setup(build) {
    build.onResolve({ filter: ANIMATE_ENTRY_IMPORT }, () => ({
      external: true,
      path: "./animate.js",
    }));
  },
};

const shared = {
  dts: true,
  external: ["react", "react-dom"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  platform: "browser",
  sourcemap: false,
  treeshake: true,
} satisfies Options;

export default defineConfig([
  {
    ...shared,
    entry: ["index.tsx"],
    esbuildPlugins: [loadAnimateEntryAtRuntime],
    splitting: true,
  },
  { ...shared, entry: ["animate.ts"], splitting: false },
]);
