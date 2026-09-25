---
"remend": patch
---

Keep comparison operators and type parameters out of the incomplete-HTML-tag stripper.

`handleIncompleteHtmlTag` already skipped math and code, but prose like `a<b` or
`Array<string…` still matched the end-of-string `<tag` heuristic and deleted the
rest of the message. A `<` immediately after an identifier character is treated as
a comparison or generic, not a tag start; real incomplete tags after whitespace
(`Hello <div`) are still stripped.
