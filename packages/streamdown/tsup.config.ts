import { defineConfig } from "tsup";

export default defineConfig({
  dts: true,
  entry: ["index.tsx", "tailwind.ts"],
  format: ["esm"],
  minify: true,
  outDir: "dist",
  sourcemap: false,
  external: ["react", "react-dom"],
  treeshake: true,
  splitting: true,
  platform: "browser",
});
