---
"streamdown": minor
---

- Add `controls.table.csvSeparator` (`"," | ";" | "\t" | "auto"`) for table copy and download CSV
- Reuse `tableDataToCSV` separator handling, including locale-aware `"auto"` mode
- Improve CSV escaping to respect the selected separator for Excel compatibility
