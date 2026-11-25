---
"streamdown": patch
---

Keep link addresses when a table is copied or downloaded. A link in a cell is exported as `[text](href)` in Markdown, CSV and TSV, including links rendered behind link safety, which now carry their address in `data-href`. Autolinks keep reading as their own address, and a link that is still streaming in stays plain text.
