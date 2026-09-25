---
"streamdown": patch
---

Give animated word spans a style object instead of a CSS string, so rendering skips parsing a style declaration for every word on every update. `createAnimatePlugin` still writes CSS strings.
