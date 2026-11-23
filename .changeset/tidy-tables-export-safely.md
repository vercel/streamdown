---
"streamdown": patch
---

Prevent oversized Markdown table copy/download from freezing the browser by preflighting a 100,000-cell budget (including padded body cells and synthetic headers/separators), a 100,000-row limit, and a conservative 5,000,000-code-unit output estimate before serialization. Preserve explicit empty-cell padding for short rows. Oversized exports report an error through the controls' existing `onError` callbacks instead of producing a partial export.
