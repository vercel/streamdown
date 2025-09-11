---
"streamdown": patch
---

Fix word-internal underscores being incorrectly treated as incomplete markdown

Previously, underscores used as word separators (e.g., `hello_world`, `snake_case`) were incorrectly identified as incomplete italic markdown, causing an extra underscore to be appended. This fix:

- Detects when underscores are between word characters and treats them as literals
- Preserves the streaming markdown completion for genuine incomplete italics (e.g., `_italic text`)
- Correctly handles trailing newlines when completing italic formatting

Fixes the issue where `hello_world` would become `hello_world_` when `parseIncompleteMarkdown` was enabled.