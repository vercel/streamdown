---
"remend": patch
---

Fix quadratic code-block scanning. `isInsideCodeBlock` now builds a linear-time position lookup (cached per text) instead of rescanning the whole prefix on every call, so handlers that probe many positions no longer degrade quadratically. Repairing an unclosed, bracket-heavy 58k-character code block drops from ~915ms to ~0.4ms per call.
