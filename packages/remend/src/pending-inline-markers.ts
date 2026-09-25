import { isInsideCodeBlock } from "./code-block-utils";
import {
  isWithinHtmlTag,
  isWithinLinkOrImageUrl,
  isWithinMathBlock,
} from "./utils";

const pendingMarker = /(?:^|\s)(\*{1,2}|_{1,2}|~~)$/;

const indentedCode = /^(?: {4}|\t)/;

export const holdPendingInlineMarkers = (text: string): string => {
  const match = pendingMarker.exec(text);
  if (!match || match.index + match[0].length !== text.length) {
    return text;
  }
  const start = text.length - match[1].length;
  const line = text.slice(text.lastIndexOf("\n", start - 1) + 1);
  // Tilde fences and indented code are deliberately left alone until the
  // shared code scanner can distinguish them from prose.
  if (
    text.includes("~~~") ||
    indentedCode.test(line) ||
    isInsideCodeBlock(text, start) ||
    isWithinMathBlock(text, start) ||
    isWithinHtmlTag(text, start) ||
    isWithinLinkOrImageUrl(text, start)
  ) {
    return text;
  }
  return text.slice(0, start);
};
