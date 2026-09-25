/**
 * An end-anchored pattern whose delimiter may follow the opening marker only
 * as the text's final character.
 */
export interface TrailingPattern {
  delimiter: string;
  markerLength: number;
  regex: RegExp;
}

// A match's marker ends at or after the last delimiter before the final
// character, or at the final character when there is none, so matching from
// there finds the same match without scanning the rest of the document.
export const matchTrailing = (
  text: string,
  { delimiter, markerLength, regex }: TrailingPattern
): RegExpMatchArray | null => {
  const last = text.lastIndexOf(delimiter, text.length - 2);
  const markerEnd = last === -1 ? text.length - 1 : last;
  return text.slice(Math.max(0, markerEnd - markerLength + 1)).match(regex);
};

export const boldPattern: TrailingPattern = {
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
  delimiter: "_",
  markerLength: 2,
  regex: /(__)([^_]+)_$/,
};
export const halfCompleteTildePattern: TrailingPattern = {
  delimiter: "~",
  markerLength: 2,
  regex: /(~~)([^~]+)~$/,
};
export const whitespaceOrMarkersPattern = /^[\s_~*`]*$/;
export const listItemPattern = /^[\s]*[-*+][\s]+$/;
export const letterNumberUnderscorePattern = /[\p{L}\p{N}_]/u;
export const fourOrMoreAsterisksPattern = /^\*{4,}$/;
