---
"remend": minor
---

Rework code-region detection and double-underscore counting.

A shared single-pass scanner now classifies fences and inline code spans, replacing the per-character rescans that made healing quadratic on delimiter-heavy input. Fences follow CommonMark rules (line-start only, up to 3 spaces of indent, `~~~` supported, closers must match the opener's length, info strings excluded from emphasis), and inline code spans close on a backtick run of exactly the opener's length.

Double underscores are counted per maximal run with flanking rules, so identifiers containing `__` (like `snake__case`) no longer invent or swallow emphasis closers.

Healing is now idempotent: healed output re-heals to itself, including incomplete image removal and the trailing space it exposes.
