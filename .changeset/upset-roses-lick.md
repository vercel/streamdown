---
"streamdown": patch
---

- Fix code block line wrapping when line numbers are disabled.
- Ensure code block lines are rendered as block elements regardless of the `lineNumbers` setting.
- Prevent multiple code lines from collapsing into a single visual line when `lineNumbers={false}`.
