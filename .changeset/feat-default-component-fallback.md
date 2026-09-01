---
"streamdown": minor
---

feat: add `defaultComponent` fallback prop for unstyled/custom tag rendering

Adds a new `defaultComponent` prop to `<Streamdown>`. When provided, it is
used as a fallback renderer for any HTML tag or allowed custom tag that does
not have an explicit entry in the `components` map. This enables unstyled /
passthrough rendering without enumerating every tag:

```tsx
<Streamdown
  defaultComponent={({ node, children, ...props }) =>
    createElement(node!.tagName, props, children)
  }
>
  {markdown}
</Streamdown>
```

`defaultComponent` applies to custom tags declared via `allowedTags` (no
explicit component entry) and to standard HTML tags absent from the built-in
Tailwind component set. Explicit `components` entries always win.

Refs #543
