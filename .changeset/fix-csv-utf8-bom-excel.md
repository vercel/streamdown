---
"streamdown": patch
---

fix: prepend UTF-8 BOM to CSV downloads so Excel on Windows correctly detects the encoding

Excel on Windows falls back to the system ANSI codepage when a CSV file has no BOM,
corrupting non-ASCII characters (Hebrew, Arabic, CJK, etc.). Prepending `\uFEFF` to
CSV string content before creating the `Blob` aligns with the standard workaround
(RFC 4180 permits it) and fixes the garbled-text issue without affecting any other
download formats or text editors.
