---
"remend": patch
---

Allow syntax extensions to supply opaque source ranges through `literalRanges`.
Incomplete-Markdown repair preserves those ranges while retaining full-document
formatting context. Range callbacks use the current source after each edit, and
nested calls and exceptions restore the caller's scanner scope.
