# remend

## 1.2.1

### Patch Changes

- 6374fbf: Fix stray asterisks stemming from mermaid diagrams

## 1.2.0

### Minor Changes

- 3e6a77d: Handle incomplete HTML tags

### Patch Changes

- c347b53: Fix whitespace-bound asterisks
- 6b42a85: Remove CJS builds
- 4fffb9f: Repair comparison operators in list items

## 1.1.0

### Minor Changes

- 3376255: Allow for custom handlers

### Patch Changes

- add8eda: Make incomplete link protocol customizable
- 19dae64: handle half-complete markdown formatting markers
- 1d4a3c7: Fix bold completion

## 1.0.2

### Patch Changes

- 104798e: Make remend configurable
- 6769e7a: Fix trailing space issues
- 217b128: fix: Code block output contains extra \_\_
- 68109f2: Fix setext heading issues
- e0ee74e: fix: Inline code block containing $$ is incorrectly completed
- 45f0f4d: Improve support for horizontal rules
- b8c8c79: fix: should not add closing markers to overlapping bold and italic
  fix: should handle code block with incomplete inline code after
  fix: should not add closing markers to overlapping bold and italic
  fix: should close nested underscore italic before bold
- 68f29c0: should not add trailing underscore for images with underscores in URL (#284)
- e7eca51: fix incorrect bold-italic nesting auto-completion
- d708864: Fix asterisks inside math blocks being incorrectly treated as italic markers

## 1.0.2-canary.0

### Patch Changes

- 104798e: Make remend configurable
- 6769e7a: Fix trailing space issues
- 217b128: fix: Code block output contains extra \_\_
- 68109f2: Fix setext heading issues
- e0ee74e: fix: Inline code block containing $$ is incorrectly completed
- 45f0f4d: Improve support for horizontal rules
- b8c8c79: fix: should not add closing markers to overlapping bold and italic
  fix: should handle code block with incomplete inline code after
  fix: should not add closing markers to overlapping bold and italic
  fix: should close nested underscore italic before bold
- 68f29c0: should not add trailing underscore for images with underscores in URL (#284)
- e7eca51: fix incorrect bold-italic nesting auto-completion
- d708864: Fix asterisks inside math blocks being incorrectly treated as italic markers

## 1.0.1

### Patch Changes

- d3ed120: Split out Remend
