import { getScan, REGION } from "./scan";
/**
 * An end-anchored pattern whose delimiter may follow the opening marker only
 * as the text's final character.
 */
export interface TrailingPattern {
  delimiter: string;
  markerLength: number;
  regex: RegExp;
  trailingDelimiter?: "optional" | "required";
}

// A match's marker ends at or after the last delimiter before the final
// character, or at the final character when there is none, so matching from
// there finds the same match without scanning the rest of the document.
export const matchTrailing = (
  text: string,
  { delimiter, markerLength, regex, trailingDelimiter }: TrailingPattern
): RegExpMatchArray | null => {
  const scan = getScan(text);
  if (!scan.regions.includes(REGION.LITERAL)) {
    const last = text.lastIndexOf(delimiter, text.length - 2);
    const markerEnd = last === -1 ? text.length - 1 : last;
    const offset = Math.max(0, markerEnd - markerLength + 1);
    const match = text.slice(offset).match(regex);
    if (match) match.index = offset + (match.index ?? 0);
    return match;
  }
  // Opaque token contents cannot participate in marker recognition. Scan the
  // original source with the existing region classification, without a masked
  // source string or independently repaired fragments.
  let last = text.length - 2;
  while (
    last >= 0 &&
    (text[last] !== delimiter || scan.regions[last] === REGION.LITERAL)
  )
    last--;
  const start = Math.max(
    0,
    (last < 0 ? text.length - 1 : last) - markerLength + 1
  );
  const marker = delimiter.repeat(markerLength);
  if (
    text.slice(start, start + markerLength) !== marker ||
    scan.regions[start] === REGION.LITERAL
  )
    return null;
  let trailing = false;
  for (let i = start + markerLength; i < text.length; i++) {
    if (scan.regions[i] === REGION.LITERAL || text[i] !== delimiter) continue;
    if (!trailingDelimiter || i !== text.length - 1) return null;
    trailing = true;
  }
  if (
    trailingDelimiter === "required" &&
    (!trailing || start + markerLength >= text.length - 1)
  )
    return null;
  const match = [
    text.slice(start),
    marker,
    text.slice(
      start + markerLength,
      trailingDelimiter === "required" ? -1 : undefined
    ),
  ] as RegExpMatchArray;
  match.index = start;
  match.input = text;
  return match;
};

export const boldPattern: TrailingPattern = {
  trailingDelimiter: "optional",
  delimiter: "*",
  markerLength: 2,
  regex: /(\*\*)([^*]*\*?)$/,
};
export const italicPattern: TrailingPattern = {
  delimiter: "_",
  markerLength: 2,
  regex: /(__)([^_]*?)$/,
};
export const boldItalicPattern: TrailingPattern = {
  delimiter: "*",
  markerLength: 3,
  regex: /(\*\*\*)([^*]*?)$/,
};
export const singleAsteriskPattern: TrailingPattern = {
  delimiter: "*",
  markerLength: 1,
  regex: /(\*)([^*]*?)$/,
};
export const singleUnderscorePattern: TrailingPattern = {
  delimiter: "_",
  markerLength: 1,
  regex: /(_)([^_]*?)$/,
};
export const strikethroughPattern: TrailingPattern = {
  delimiter: "~",
  markerLength: 2,
  regex: /(~~)([^~]*?)$/,
};
export const halfCompleteUnderscorePattern: TrailingPattern = {
  trailingDelimiter: "required",
  delimiter: "_",
  markerLength: 2,
  regex: /(__)([^_]+)_$/,
};
export const halfCompleteTildePattern: TrailingPattern = {
  trailingDelimiter: "required",
  delimiter: "~",
  markerLength: 2,
  regex: /(~~)([^~]+)~$/,
};
export const whitespaceOrMarkersPattern = /^[\s_~*`]*$/;
export const listItemPattern = /^[\s]*[-*+][\s]+$/;
export const letterNumberUnderscorePattern = /[\p{L}\p{N}_]/u;
export const fourOrMoreAsterisksPattern = /^\*{4,}$/;
