---
"remend": patch
---

Leave `_`, `*` and `~` inside bare URLs alone. GFM links `https://example.com/_next` or `www.example.com/_next` as they are, so remend no longer adds a closer for the marker in the URL, which showed up as a stray `_` after the link.
