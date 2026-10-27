---
"streamdown": patch
---

Distinguish remark and rehype plugins by function identity when caching processors, so same-name plugins with different closures do not reuse each other's behavior.
