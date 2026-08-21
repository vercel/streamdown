---
"remend": patch
---

Fix crash on iOS 16.0-16.2 / Safari < 16.3 by removing the lookbehind assertion from the single-tilde escape pattern (#519).

JSCore on those versions doesn't support lookbehind (`(?<=...)`) and throws a `SyntaxError` while the module is being evaluated, before any user code runs, so there is no way to catch it. The preceding word character is now captured and written back in the replacement instead.
