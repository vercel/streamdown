---
"streamdown": patch
---

fix: prepend UTF-8 BOM to CSV downloads for Excel compatibility

- `save()` now prepends `\uFEFF` for `text/csv` string content so Excel on
  Windows detects UTF-8 encoding instead of falling back to ANSI.
- `TableDownloadButton` refactored to use `save()` instead of inline Blob
  creation, ensuring the public API also gets the BOM fix.
