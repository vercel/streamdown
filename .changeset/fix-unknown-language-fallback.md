---
"@streamdown/code": patch
---

Fall back to plain text highlighting when the code block language identifier is unknown or truncated mid-stream, preventing Shiki from throwing on unsupported language names.
