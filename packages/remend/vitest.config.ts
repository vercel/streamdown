import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Vitest 5.1 defaults to one fresh worker per file. Remend's property
    // tests already saturate a CI runner; paying isolate startup on top of
    // that pushes the streaming sweep past the default 5s test timeout.
    isolate: false,
    fileParallelism: false,
  },
});
