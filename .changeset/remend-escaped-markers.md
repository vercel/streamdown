---
"remend": minor
---

Heal emphasis the way CommonMark and GFM parse it

- Closes only openers that exist, innermost first, within the paragraph, list item or link text that holds them. An open code span closes before the emphasis around it.
- Leaves literal markers alone: `**Note:**This`, `*.ts`, `x**2`, `(+, -, *, /)`, fill-in blanks like `______`, and runs after an escaped marker like `\**`. A trailing backslash is escaped so it can't escape the closers.
- Stops closing an opener once its line has ended and the next line has started, since models close emphasis on the line that opens it. A stray `*` in code written outside a fence, like `char *name`, no longer italicizes what follows.
- Closes an inline code span only within its own block, and never with a closer that would start a fence. A `[` before a complete link stays literal instead of healing a second link.
- The `bold`, `italic`, `boldItalic` and `strikethrough` options still apply, but the built-in handlers they controlled are now one `emphasis` handler at priority 30. Custom handlers ordered against the old priorities may need new ones.
