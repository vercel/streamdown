# remend

## 1.5.0

### Minor Changes

- 2dc4aa6: Heal emphasis the way CommonMark and GFM parse it

  - Closes only openers that exist, innermost first, within the paragraph, list item or link text that holds them. An open code span closes before the emphasis around it.
  - Leaves literal markers alone: `**Note:**This`, `*.ts`, `x**2`, `(+, -, *, /)`, fill-in blanks like `______`, and runs after an escaped marker like `\**`. A trailing backslash is escaped so it can't escape the closers.
  - Stops closing an opener once its line has ended and the next line has started, since models close emphasis on the line that opens it. A stray `*` in code written outside a fence, like `char *name`, no longer italicizes what follows.
  - Closes an inline code span only within its own block, and never with a closer that would start a fence. A `[` before a complete link stays literal instead of healing a second link.
  - The `bold`, `italic`, `boldItalic` and `strikethrough` options still apply, but the built-in handlers they controlled are now one `emphasis` handler at priority 30. Custom handlers ordered against the old priorities may need new ones.

### Patch Changes

- ae6fa3b: Support `exactOptionalPropertyTypes`: add `| undefined` to optional props in the public types so possibly-`undefined` values can be forwarded to `<Streamdown>` and `remend` without type errors
- 04dd684: Skip completed-link searches for brackets already known to be literal, avoiding quadratic work on unmatched bracket prefixes before a completed link.
- fdc4255: Avoid quadratic emphasis processing for unmatched opening brackets followed by many completed links, including when link and image healing are disabled. Invalidate enclosing brackets in constant time while preserving link and image label scoping.
- 2dc4aa6: Complete unfinished links and images only in the current block: the paragraph, list item, heading or table row at the end of the text. An unclosed `[` or `](` in an earlier block no longer adds `](streamdown:incomplete-link)` to later text, or drops the text after it.
- e54bc44: docs: describe the loading placeholder for incomplete images in the README
- b393921: Stop adding a zero-width space to a dash that starts a new list item after a list item or block quote, which made it show as a stray "-" on the line above.
- d96e8c0: Stop escaping single tildes inside URLs and HTML tag attributes, so links like `https://example.com/a~b` keep a working address instead of getting a backslash in the middle.
- 63bd417: Avoid quadratic emphasis gating on messages with many skipped delimiter openers by precomputing content and delimiter lookups and skipping disabled or overlength runs before gating.

## 1.4.0

### Minor Changes

- fdd1351: Rework code-region detection and double-underscore counting.

  A shared single-pass scanner now classifies fences and inline code spans, replacing the per-character rescans that made healing quadratic on delimiter-heavy input. Fence and span detection follows CommonMark, so `~~~` fences, fences inside block quotes and list items, CRLF line endings, and multi-backtick spans are all recognized, and content inside code is never healed as prose.

  Double underscores are counted per maximal run with flanking rules, so identifiers containing `__` (like `snake__case`) no longer invent or swallow emphasis closers.

  Healing is now idempotent. Healed output re-heals to itself, and text-only link mode resolves every unmatched bracket in one call.

### Patch Changes

- cf0ac1c: Stop the incomplete-HTML-tag handler from truncating math expressions.

  `handleIncompleteHtmlTag` guarded against code blocks but not math, so an ordinary
  comparison inside math — `$$ I = \sum_{j<k} p_j $$` — matched the incomplete-tag
  pattern and deleted everything from the `<` to the end of the string. The trailing
  `$$` was then auto-closed by the katex handler, so KaTeX rendered a parse error and
  the rest of the message never reached the DOM.

  The handler now skips candidates inside math blocks (`$`, `$$`, `\(`, `\[`), matching
  the guard the emphasis handlers already had. Because the pattern is leftmost-matching,
  it also walks forward to later candidates instead of bailing out, so a genuine
  incomplete tag after a math expression is still stripped.

- e0ce123: Incomplete images during streaming now render a loading placeholder instead of being removed entirely. Incomplete images (e.g. `![alt](https://exampl`) are replaced with `![alt](streamdown:incomplete-image)` by remend, and the streamdown `ImageComponent` renders an animated skeleton for this special URL. This mirrors the existing behavior for incomplete links (`streamdown:incomplete-link`). The `streamdown` protocol is allowlisted for `img[src]` in the default sanitize schema so the sentinel survives rehype-sanitize + rehype-harden.

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
