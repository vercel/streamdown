---
"streamdown": patch
---

Avoid quadratic newline scanning when preprocessing many inline custom-tag pairs on a single line, preventing rendering stalls for untrusted Markdown with allowedTags enabled.
