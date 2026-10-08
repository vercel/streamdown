---
"remend": minor
---

Heal emphasis the way CommonMark and GFM parse it

- Closes only openers that exist, innermost first, within the paragraph, list item or link text that holds them. An open code span closes before the emphasis around it.
- Leaves literal markers alone: `**Note:**This`, `*.ts`, `x**2`, and runs after an escaped marker like `\**`. A trailing backslash is escaped so it can't escape the closers.
- The `bold`, `italic`, `boldItalic` and `strikethrough` options still apply, but the built-in handlers they controlled are now one `emphasis` handler at priority 30. Custom handlers ordered against the old priorities may need new ones.
