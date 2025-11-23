import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.tsx"],
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom"],
  treeshake: true,
  splitting: true,
  platform: "browser",
});
