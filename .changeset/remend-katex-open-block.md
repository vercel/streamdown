---
"remend": patch
---

fix(remend): close an unterminated `$$` block based on the block that is still open, not the first `$$` in the text, so a single-line formula after earlier math (e.g. in a table cell) is closed on the same line
