---
"streamdown": patch
---

Prevent sparse headerless tables from expanding during Markdown copy/download by leaving short body rows unpadded for GFM to fill. Preflight Markdown exports against a 100,000-cell budget (including synthetic headers and separators), a 100,000-row limit, and a conservative 5,000,000-code-unit output estimate before serialization. Oversized exports report an error through the controls' existing `onError` callbacks instead of producing a partial export.
