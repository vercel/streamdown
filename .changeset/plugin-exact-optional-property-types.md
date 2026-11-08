---
"@streamdown/code": patch
"@streamdown/math": patch
"@streamdown/mermaid": patch
---

Support `exactOptionalPropertyTypes`: add `| undefined` to optional props in the plugin option types so possibly-`undefined` values can be forwarded to `createCodePlugin`, `createMathPlugin` and `createMermaidPlugin` without type errors
