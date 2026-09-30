---
"@streamdown/code": patch
"streamdown": patch
---

Bound the code highlight cache. Results of streaming code blocks are no longer cached (each is superseded by the next update), and finished code blocks are kept in a least-recently-used cache of up to 200 results. Lookups compare the full code, so blocks that differ only in the middle no longer share tokens. A code block also ignores highlight results for code it has already moved past.
