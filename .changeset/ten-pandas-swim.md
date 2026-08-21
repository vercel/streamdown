---
"streamdown": minor
---

- Add `csvSeparator` option for CSV export (`"," | ";" | "\t" | "auto"`).
- Update `tableDataToCSV` to use configurable separator instead of hardcoded comma.
- Add `"auto"` mode using locale-based decimal detection via `Intl.NumberFormat`.
- Improve CSV escaping to respect selected separator for proper Excel compatibility.
