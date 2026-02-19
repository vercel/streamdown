---
"streamdown": minor
---

Add support for custom starting line numbers in code blocks via the `startLine` meta option.

Code blocks can now specify a starting line number in the meta string:

````md
```js startLine=10
const x = 1;
```
````

This renders line numbers beginning at 10 instead of the default 1. The feature works by parsing the `startLine=N` value from the fenced-code meta string and applying `counter-reset: line N-1` to the `<code>` element.
