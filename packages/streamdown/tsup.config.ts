import { defineConfig, type Options } from "tsup";

const ANIMATE_IMPORT = /^\.\/animate$/;

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
    // The word fade is built on its own below and imported from there at
    // runtime, so no chunk it shares with this bundle can pull it up front.
    esbuildPlugins: [
      {
        name: "load-animate-at-runtime",
        setup(build) {
          build.onResolve({ filter: ANIMATE_IMPORT }, ({ importer }) =>
            importer.endsWith("import-animate.ts")
              ? { external: true, path: "./animate.js" }
              : undefined
          );
        },
      },
    ],
    splitting: true,
  },
  { ...shared, dts: false, entry: { animate: "lib/animate.ts" } },
]);
