---
"remend": patch
---

Keep a streaming `-` or `=` inside a block quote from turning the quoted line above it into a heading. `> Steps:` followed by `> -` rendered as an `h2` until the list item after the dash arrived. Outside block quotes this was already handled. A `-` or `=` at the end of an unclosed code block no longer gets a zero-width space added to the code.
