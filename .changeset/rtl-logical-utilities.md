---
"streamdown": patch
---

Use logical direction utilities so layout mirrors in right-to-left text.

`rehypeBlockDirection` already marks blockquotes, list items and table cells
with the correct `dir`, but the styling used physical utilities (`pl-4`,
`border-l-4`, `text-left`, `right-0`), so none of it mirrored. In RTL the
blockquote bar sat across the page from its text, nested lists indented from
the wrong edge, and table headers aligned to the opposite side from their own
cells.

Converts the direction-aware surfaces to logical utilities, and teaches `cn`
that logical and physical utilities control the same axis — without that,
`twMerge("ps-4", "pl-2")` returns both and a consumer's `className` override
would be resolved by stylesheet order rather than by intent.

The code block is deliberately unchanged: it is pinned `dir="ltr"`, so its
physical offsets are correct and carry that intent.
