---
"streamdown": patch
---

Fix $$ inside code blocks being treated as math delimiters

Code blocks can contain `$$` as shell syntax (e.g., `pstree -p $$` for current process ID). The math block merging logic was incorrectly counting `$$` inside code blocks, causing subsequent content to be merged as if it were part of a math block.

Added tracking of previous token type to skip math merging when the previous block was a code block.
