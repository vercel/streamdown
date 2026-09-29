---
"@streamdown/code": patch
---

Bound the highlight result cache. While a code block streams, each result now replaces the previous one instead of staying in memory for the life of the page, and past 2,000,000 characters of cached code the oldest results are dropped. A block also always ends on the tokens of its latest code when several of its requests finish together.
