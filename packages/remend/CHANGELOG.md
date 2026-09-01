# remend

## 1.3.1

### Patch Changes

- a99d675: Fix crash on iOS 16.0-16.2 / Safari < 16.3 by removing the lookbehind assertion from the single-tilde escape pattern (#519).

  JSCore on those versions doesn't support lookbehind (`(?<=...)`) and throws a `SyntaxError` while the module is being evaluated, before any user code runs, so there is no way to catch it. The preceding word character is now captured and written back in the replacement instead.

- 9f96409: Preserve complete italic emphasis when a closing asterisk is followed by word text.
- 8093f2a: Treat LaTeX paren and bracket math as protected math contexts during emphasis completion.
- 57c3089: Fix quadratic code-block scanning. `isInsideCodeBlock` now builds a linear-time position lookup (cached per text) instead of rescanning the whole prefix on every call, so handlers that probe many positions no longer degrade quadratically. Repairing an unclosed, bracket-heavy 58k-character code block drops from ~915ms to ~0.4ms per call.

## 1.3.0

### Minor Changes

- e50b0c4: Add opt-in inline KaTeX completion (`$formula` → `$formula$`) via a new `inlineKatex` option that defaults to `false` to avoid ambiguity with currency symbols. Also fixes block KaTeX completion when streaming produces a partial closing `$`.
- 716a5f0: Escape single `~` between word characters to prevent false strikethrough rendering (e.g. `20~25°C` no longer renders as strikethrough). Adds a new `singleTilde` option (enabled by default) that can be disabled via `{ singleTilde: false }`.

## 1.2.2

### Patch Changes

- a725579: Fix emphasis completion handlers incorrectly closing bold/italic/strikethrough markers that appear inside complete inline code spans (e.g. `` `**bold` `` no longer gets a stray `**` appended outside the backticks).

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
