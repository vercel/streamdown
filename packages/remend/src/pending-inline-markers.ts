import { isInsideCodeBlock } from "./code-block-utils";
import { isWithinHtmlTag, isWithinMathBlock } from "./utils";

const pendingMarker = /(?:^|\s)(\*{1,2}|_{1,2}|~~)$/;

const indentedCode = /^(?: {4}|\t)/;
const isInUnfinishedDestination = (text: string, position: number): boolean => {
  let depth = 0;
  for (let i = text.lastIndexOf("\n", position - 1) + 1; i < position; i += 1) {
    const char = text[i];
    if (char === "\\") {
      i += 1;
    } else if (depth) {
      if (char === "(") {
        depth += 1;
      }
      if (char === ")") {
        depth -= 1;
      }
    } else if (char === "]" && text[i + 1] === "(") {
      depth = 1;
      i += 1;
    }
  }
  return depth > 0;
};

export const holdPendingInlineMarkers = (text: string): string => {
  const match = pendingMarker.exec(text);
  if (!match || match.index + match[0].length !== text.length) {
    return text;
  }
  const start = text.length - match[1].length;
  const line = text.slice(text.lastIndexOf("\n", start - 1) + 1);
  if (
    indentedCode.test(line) ||
    isInsideCodeBlock(text, start) ||
    isWithinMathBlock(text, start) ||
    isWithinHtmlTag(text, start) ||
    isInUnfinishedDestination(text, start)
  ) {
    return text;
  }
  return text.slice(0, start);
};
