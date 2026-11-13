---
"remend": patch
---

Stop escaping single tildes inside URLs and HTML tag attributes, so links like `https://example.com/a~b` keep a working address instead of getting a backslash in the middle.
