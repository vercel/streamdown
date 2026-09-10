---
"remend": patch
---

Stop the incomplete-HTML-tag handler from truncating math expressions.

`handleIncompleteHtmlTag` guarded against code blocks but not math, so an ordinary
comparison inside math — `$$ I = \sum_{j<k} p_j $$` — matched the incomplete-tag
pattern and deleted everything from the `<` to the end of the string. The trailing
`$$` was then auto-closed by the katex handler, so KaTeX rendered a parse error and
the rest of the message never reached the DOM.

The handler now skips candidates inside math blocks (`$`, `$$`, `\(`, `\[`), matching
the guard the emphasis handlers already had. Because the pattern is leftmost-matching,
it also walks forward to later candidates instead of bailing out, so a genuine
incomplete tag after a math expression is still stripped.
