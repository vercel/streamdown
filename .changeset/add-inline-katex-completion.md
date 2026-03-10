---
"remend": minor
---

Add opt-in inline KaTeX completion (`$formula` → `$formula$`) via a new `inlineKatex` option that defaults to `false` to avoid ambiguity with currency symbols. Also fixes block KaTeX completion when streaming produces a partial closing `$`.
