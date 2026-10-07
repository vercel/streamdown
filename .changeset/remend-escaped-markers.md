---
"remend": patch
---

fix(remend): stop appending emphasis closers that match no opener

- Match `_` and `__` delimiters with the CommonMark emphasis algorithm (flanking, rule of 3, partial matches) instead of counting parity, and drop an underscore closer that would not match
- Treat a marker as escaped only after an odd run of backslashes, so `\\*`, `\\_`, `\\**`, `\\~~`, and `` \\` `` still open
- Escape a trailing backslash before appending closers, so it cannot escape them
- Close every open underscore run in one pass, including runs before an unterminated code span, so healed output re-heals to itself
