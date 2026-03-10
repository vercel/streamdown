---
"streamdown": patch
---

Replace Tailwind v4-only `*:last:` and `*:first:` variant syntax with `[&>*:last-child]:` and `[&>*:first-child]:` arbitrary variants for compatibility with both Tailwind CSS v3 and v4. Fixes caret rendering on every line instead of only the last child in v3.
