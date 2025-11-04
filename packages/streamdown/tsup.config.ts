import { defineConfig } from "tsup";

export default defineConfig((options) => ({
  dts: true,
  entry: ["index.tsx"],
  format: ["cjs", "esm"],
  minify: !options.watch,
  outDir: "dist",
  sourcemap: options.watch ? true : false,
  external: ["react", "react-dom"],
}));
