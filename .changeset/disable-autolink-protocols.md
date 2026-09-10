---
"streamdown": minor
---

Add a `disableAutolinkProtocols` prop to `<Streamdown>` for disabling GFM autolinking of specific URL protocols (e.g. `mailto`).

```tsx
<Streamdown disableAutolinkProtocols={["mailto"]}>
  {"Contact us at hello@example.com"}
</Streamdown>
```

Bare emails and bare URLs whose protocol matches the list (case-insensitive, `"mailto"` and `"mailto:"` are equivalent) are unwrapped back to plain text. Explicit markdown links (`[text](mailto:...)`) are left as links. When the prop is omitted, autolinking behavior is completely unchanged.

Closes #607.
