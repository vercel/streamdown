# @streamdown/code

## 1.1.1

### Patch Changes

- 651873d: Fall back to plain text highlighting when the code block language identifier is unknown or truncated mid-stream, preventing Shiki from throwing on unsupported language names.

## 1.1.0

### Minor Changes

- 01d27e9: Add support for custom Shiki themes via a `themes` option on `createCodePlugin`, accepting a `[light, dark]` pair of bundled theme names or full theme registration objects.

## 1.0.3

### Patch Changes

- c597336: Use JS engine

## 1.0.2

### Patch Changes

- c995fb7: Add bundled-language aliases for common JavaScript, TypeScript, and shell code fence labels.
- 6b42a85: Remove CJS builds

## 1.0.1

### Patch Changes

- 0b80aed: Plugins
