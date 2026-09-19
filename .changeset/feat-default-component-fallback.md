---
"streamdown": minor
---

feat: add `fallbackComponent` prop for missing map entries / `allowedTags`

Adds a new `fallbackComponent` prop to `<Streamdown>`. When provided, it is
used as a fallback renderer for any HTML tag or allowed custom tag that does
not have an explicit entry in the `components` map:

```tsx
<Streamdown
  allowedTags={{ mention: ["user_id"] }}
  fallbackComponent={({ node, children, ...props }) =>
    createElement(node!.tagName, props, children)
  }
>
  {markdown}
</Streamdown>
```

`fallbackComponent` applies to custom tags declared via `allowedTags` (with no
explicit component entry) and to standard HTML tags absent from the built-in
component set (e.g. `<span>`, `<em>`, `<div>`, `<br>`). Built-in and explicit
`components` entries always win — this is not a full unstyled mode.

Refs #543
