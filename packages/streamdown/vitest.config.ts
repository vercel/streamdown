import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./__tests__/setup.ts"],
    coverage: {
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "__tests__/",
        "__benchmarks__/",
        "*.config.ts",
        "*.config.js",
        "dist/",
        "../streamdown-math/**",
        "../streamdown-cjk/**",
        "**/streamdown-math/**",
        "**/streamdown-cjk/**",
      ],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
      "@streamdown/math": path.resolve(
        import.meta.dirname,
        "../streamdown-math/index.ts"
      ),
      "@streamdown/cjk": path.resolve(
        import.meta.dirname,
        "../streamdown-cjk/index.ts"
      ),
    },
  },
});
