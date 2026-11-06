---
"streamdown": minor
---

feat: add `streamdown/core` entry whose default rehype plugins omit `rehype-raw`, so `rehype-raw` and `parse5` are not bundled. The default `streamdown` entry is unchanged. Raw HTML detection no longer depends on importing `rehype-raw` in `lib/markdown`.
