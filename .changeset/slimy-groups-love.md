---
"streamdown": patch
---

Fix node="[object Object]" HTML attribute bug. Fixed AST node objects being passed as HTML attributes by explicitly filtering out the node prop from component props before spreading to HTML elements. Components now use ...htmlProps instead of ...props to prevent prop leakage while maintaining internal node access for memoization.
