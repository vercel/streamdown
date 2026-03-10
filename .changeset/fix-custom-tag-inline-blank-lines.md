---
"streamdown": patch
---

Fix custom tag content being prematurely split when content follows the opening tag on the same line and contains double newlines (`\n\n`). The preprocessor now ensures proper HTML block structure so the parser treats the entire tag as a single unit.
