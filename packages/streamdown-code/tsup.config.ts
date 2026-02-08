import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  treeshake: true,
  platform: "browser",
  external: ["react", "react-dom"],
});
