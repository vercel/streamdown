---
"streamdown": patch
---

Keep RegExp, Map and Set plugin options apart in the Markdown processor cache, so configurations that differ only in one of those values, such as `rehype-sanitize` schemas with different attribute patterns, no longer share a processor.
