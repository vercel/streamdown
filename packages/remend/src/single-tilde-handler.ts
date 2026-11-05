// Escapes single ~ characters that appear between word characters
// to prevent remarkGfm (with singleTilde: true) from misinterpreting
// them as strikethrough markers.
// e.g. "20~25°C" → "20\~25°C" (not strikethrough)
// Does NOT escape ~~ (double tilde, valid strikethrough syntax).

import { isInsideCodeBlock } from "./code-block-utils";

// Match a single ~ that is:
// - preceded by a word character (letter, number, or underscore)
// - NOT preceded by another ~ (to avoid matching ~~)
// - NOT followed by another ~ (to avoid matching ~~)
// - followed by a word character
// Uses Unicode-aware \p{L} and \p{N} for CJK and other scripts
// Captures the preceding char instead of using a lookbehind: Safari < 16.3
// throws on lookbehind, which would crash at module evaluation (#519).
const SINGLE_TILDE = String.raw`([\p{L}\p{N}_])~(?!~)(?=[\p{L}\p{N}_])`;

// A backslash is not an escape inside an HTML tag or a URL, so it would end
// up in the attribute value or the link. These are matched before the tilde
// and kept as they are:
// - an HTML tag with attributes
// - a URL GFM autolinks while parsing, which keeps the source as is:
//   http(s):// after anything but a letter, and www. at the start or after a
//   space, tab, line break or one of ( * _ [ ] ~. It runs to the next
//   whitespace, quote, angle bracket or backtick, so a URL inside an
//   attribute or an <autolink> stops where they do.
// As above, the character before a URL is matched instead of looked behind.
const HTML_TAG = String.raw`<[a-z][\w-]*\s[^<>\n]*>`;
const URL_REST = String.raw`[^\s"'<>\x60]*`;
const PROTOCOL_URL = String.raw`(?:^|[^a-z])https?:\/\/${URL_REST}`;
const WWW_URL = String.raw`(?:^|[\t\n\r (*_\[\]~])www\.${URL_REST}`;

const SINGLE_TILDE_PATTERN = new RegExp(
  `(${HTML_TAG}|${PROTOCOL_URL}|${WWW_URL})|${SINGLE_TILDE}`,
  "giu"
);

export const handleSingleTildeEscape = (text: string): string => {
  if (!text || typeof text !== "string") {
    return text;
  }

  // Quick check: if there's no ~ in the text, skip processing
  if (!text.includes("~")) {
    return text;
  }

  return text.replace(
    SINGLE_TILDE_PATTERN,
    (match, tagOrUrl, precedingChar, offset) => {
      if (tagOrUrl) {
        return match;
      }

      const tildeOffset = offset + precedingChar.length;

      // Don't escape inside code blocks
      if (isInsideCodeBlock(text, tildeOffset)) {
        return match;
      }

      return `${precedingChar}\\~`;
    }
  );
};
