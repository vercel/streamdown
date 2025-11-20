import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    include: ["benchmarks/**/*.bench.{ts,tsx}"],
    environment: "jsdom",
    globals: true,
    setupFiles: ["./benchmarks/setup.ts"],
    benchmark: {
      include: ["benchmarks/**/*.bench.{ts,tsx}"],
      reporters: ["default"],
    },
  },
  resolve: {
    alias: {
      streamdown: path.resolve(__dirname, "./packages/streamdown"),
    },
  },
});
