---
"remend": patch
---

Fix quadratic scans on long streamed documents: the math-context check now uses a one-pass lookup, and the position caches keep the latest string object so an equal string from the previous call does not trigger a full compare on every probe.
