---
"streamdown": patch
---

Fix `dir="auto"` in static mode to detect text direction per semantic block (instead of once for the whole document), keep code LTR, and use content-majority direction for mixed-script prose.
