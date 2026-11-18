---
"streamdown": patch
---

Fix table copy and download losing content: images are copied as Markdown (`![alt](src)`) whether or not they loaded, body-row `<th>` cells are kept, and tables without a header row copy with an empty header row instead of an empty string. Image alt text and sources are escaped so they render back unchanged, and literal image syntax in a cell is never mistaken for a real image.
