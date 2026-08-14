/**
 * Unicode ranges for RTL "strong" characters.
 * Covers: Hebrew, Arabic, Syriac, Thaana, NKo, Samaritan, Mandaic,
 * Arabic Supplement/Extended, and RTL presentation forms.
 */
const RTL_PATTERN = /[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/;

const LETTER_PATTERN = /\p{L}/u;

/**
 * Detect text direction by counting strong characters in the text.
 * Ties use the first strong character, preserving intuitive behavior for
 * short mixed labels while allowing RTL-majority prose that starts with an
 * English identifier to remain RTL.
 *
 * Markdown stripping is best-effort. Fenced and inline code are excluded
 * because code is always rendered LTR and should not influence surrounding
 * prose.
 *
 * @returns "rtl" if RTL strong characters are the majority, "ltr" otherwise
 */
export function detectTextDirection(text: string): "ltr" | "rtl" {
  const stripped = text
    .replace(/(```|~~~)[\s\S]*?\1/g, "") // fenced code
    .replace(/^#{1,6}\s+/gm, "") // headings
    .replace(/(\*{1,3}|_{1,3})/g, "") // bold/italic
    .replace(/`[^`]*`/g, "") // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // links (keep text)
    .replace(/^[\s>*\-+\d.]+/gm, ""); // list markers, blockquotes

  let firstStrong: "ltr" | "rtl" | undefined;
  let ltrCount = 0;
  let rtlCount = 0;

  for (const char of stripped) {
    if (RTL_PATTERN.test(char)) {
      firstStrong ??= "rtl";
      rtlCount += 1;
      continue;
    }
    // Latin, CJK, Cyrillic, etc. — any letter that's not RTL is LTR.
    if (LETTER_PATTERN.test(char)) {
      firstStrong ??= "ltr";
      ltrCount += 1;
    }
  }

  if (rtlCount > ltrCount) {
    return "rtl";
  }
  if (ltrCount > rtlCount) {
    return "ltr";
  }
  return firstStrong ?? "ltr";
}
