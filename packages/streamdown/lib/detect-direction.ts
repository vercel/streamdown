/**
 * Unicode ranges for RTL "strong" characters.
 * Covers: Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan, Mandaic,
 * Arabic Supplement/Extended, and RTL presentation forms.
 */
const RTL_PATTERN = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

const LETTER_PATTERN = /\p{L}/u;

/**
 * Detect text direction using the "first strong character" algorithm.
 * Strips common markdown syntax then finds the first Unicode letter
 * with strong directionality.
 *
 * Note: markdown stripping is best-effort — nested formatting,
 * multi-line fenced code blocks, and raw HTML are not fully handled.
 * This is acceptable since the algorithm only needs to reach the first
 * strong character, which is almost always in plain prose.
 *
 * @returns "rtl" if first strong char is RTL, "ltr" otherwise
 */
export function detectTextDirection(text: string): "ltr" | "rtl" {
  // Strip common markdown syntax to get to actual text content
  const stripped = text
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/(\*{1,3}|_{1,3})/g, "") // bold/italic
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links (keep text)
    .replace(/^[\s>*\-+\d.]+/gm, ""); // list markers, blockquotes

  // Find first strong directional character (any Unicode letter)
  for (const char of stripped) {
    if (RTL_PATTERN.test(char)) {
      return "rtl";
    }
    // Latin, CJK, Cyrillic, etc. — any letter that's not RTL is LTR
    if (LETTER_PATTERN.test(char)) {
      return "ltr";
    }
  }

  return "ltr";
}
