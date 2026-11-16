---
"remend": patch
---

Avoid quadratic emphasis gating on messages with many skipped delimiter openers by precomputing content and delimiter lookups and skipping disabled or overlength runs before gating.
