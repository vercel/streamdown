/**
 * Unicode ranges for RTL "strong" characters.
 * Covers: Arabic, Hebrew, Thaana, NKo, Samaritan, Mandaic, Syriac,
 * Arabic Supplement/Extended, and RTL presentation forms.
 */
const RTL_PATTERN =
  /[\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0800-\u083F\u0840-\u085F\u08A0-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

/**
 * Detect text direction using the "first strong character" algorithm.
 * Skips whitespace, punctuation, digits, and markdown syntax to find
 * the first Unicode letter with strong directionality.
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
    if (RTL_PATTERN.test(char)) return "rtl";
    // Latin, CJK, Cyrillic, etc. — any letter that's not RTL is LTR
    if (/\p{L}/u.test(char)) return "ltr";
  }

  return "ltr";
}
