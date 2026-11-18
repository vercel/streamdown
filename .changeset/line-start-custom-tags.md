---
"streamdown": patch
---

Leave a multi-line custom tag at the start of a line unpadded when padding would break the block around it: when the line continues a paragraph, when the tag is in a blockquote, or when text follows the opening tag in a list item. The tag no longer renders empty with its body moved out, and the list or blockquote no longer splits.
