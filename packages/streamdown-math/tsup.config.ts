import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.ts"],
  format: ["cjs", "esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  treeshake: true,
  platform: "browser",
  external: ["react", "react-dom"],
});
