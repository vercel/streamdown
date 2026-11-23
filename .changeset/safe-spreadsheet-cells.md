---
"streamdown": patch
---

Neutralize spreadsheet formula prefixes in CSV and TSV table exports, including column headers, body-row headers, and data cells. Prefix potentially executable values with an apostrophe before delimiter escaping, including formulas hidden behind leading whitespace or control characters. Markdown exports and the source table data remain unchanged.
