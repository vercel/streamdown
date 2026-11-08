---
"streamdown": patch
---

Match code block languages case-insensitively when picking the download file extension, so `Python` downloads as `file.py`, and fall back to `.txt` for names like `constructor` instead of reading them from the object prototype.
