import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["src/index.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  treeshake: true,
  splitting: true,
  platform: "browser",
});
