---
"streamdown": patch
---

Fix table copy and download losing content: images are copied as Markdown (`![alt](src)`) whether or not they loaded, body-row `<th>` cells are kept, and tables without a header row copy with an empty header row instead of an empty string.
