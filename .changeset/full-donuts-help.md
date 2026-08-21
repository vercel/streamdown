---
"streamdown": minor
---

- Add custom download filenames for code, table, and mermaid via the `controls` prop
- Configure downloads with `download: { filename: "customName" }` while keeping boolean `true`/`false` to show or hide
- Preserve automatic file-extension mapping based on language or export format
- Remove the `codeDownload` prop in favor of the unified `controls` API
