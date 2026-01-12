import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: [
    "index.tsx",
    "plugins/shiki/index.ts",
    "plugins/mermaid/index.ts",
    "plugins/katex/index.ts",
  ],
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: [
    "react",
    "react-dom",
    "shiki",
    "mermaid",
    "katex",
    "rehype-katex",
    "remark-math",
  ],
  treeshake: true,
  splitting: true,
  platform: "browser",
});
