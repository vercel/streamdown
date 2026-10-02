import { isInsideCodeBlock } from "./code-block-utils";
import { isWithinMathBlock } from "./utils";

// Matches an incomplete HTML tag at the end of the string.
// Must start with < followed by a letter (opening tag) or / (closing tag),
// and must NOT contain a > (which would close the tag).
const incompleteHtmlTagPattern = /<[a-zA-Z/][^>]*$/;

const tagNameStartPattern = /[a-zA-Z/]/;

const identifierCharPattern = /[A-Za-z0-9_]/;

const htmlTagNamePattern = /^[a-zA-Z][a-zA-Z0-9]*/;

// Common HTML tag names. Used only when `<` is glued to an identifier
// (`a<b`) so we can tell a mid-stream tag from a comparison or generic.
const plausibleHtmlTags = new Set([
  "a",
  "abbr",
  "article",
  "aside",
  "audio",
  "b",
  "base",
  "blockquote",
  "body",
  "br",
  "button",
  "canvas",
  "caption",
  "cite",
  "code",
  "col",
  "colgroup",
  "data",
  "datalist",
  "dd",
  "del",
  "details",
  "dfn",
  "dialog",
  "div",
  "dl",
  "dt",
  "em",
  "embed",
  "fieldset",
  "figcaption",
  "figure",
  "footer",
  "form",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "head",
  "header",
  "hgroup",
  "hr",
  "html",
  "i",
  "iframe",
  "img",
  "input",
  "ins",
  "kbd",
  "label",
  "legend",
  "li",
  "link",
  "main",
  "map",
  "mark",
  "menu",
  "meta",
  "meter",
  "nav",
  "noscript",
  "object",
  "ol",
  "optgroup",
  "option",
  "output",
  "p",
  "param",
  "path",
  "picture",
  "pre",
  "progress",
  "q",
  "rp",
  "rt",
  "ruby",
  "s",
  "samp",
  "script",
  "search",
  "section",
  "select",
  "slot",
  "small",
  "source",
  "span",
  "strong",
  "style",
  "sub",
  "summary",
  "sup",
  "svg",
  "table",
  "tbody",
  "td",
  "template",
  "textarea",
  "tfoot",
  "th",
  "thead",
  "time",
  "title",
  "tr",
  "track",
  "u",
  "ul",
  "var",
  "video",
  "wbr",
  "g",
  "circle",
  "rect",
  "line",
  "polyline",
  "polygon",
  "ellipse",
  "text",
  "tspan",
  "defs",
  "clippath",
  "mask",
  "use",
  "symbol",
]);

const hasMathDelimiters = (text: string): boolean =>
  text.includes("$") || text.includes("\\(") || text.includes("\\[");

const startsTag = (text: string, index: number): boolean => {
  const nextChar = text[index + 1];
  return nextChar !== undefined && tagNameStartPattern.test(nextChar);
};

// After a tag name, empty / self-closing / attribute-like suffixes look like
// HTML. Free prose words without `=` look like a comparison continuation.
const looksLikeHtmlAttributeSuffix = (suffix: string): boolean => {
  if (/^\s*\/?\s*$/.test(suffix)) {
    return true;
  }

  // Attributes require a space (or a bare `/` for self-closing).
  if (
    !(
      suffix.startsWith(" ") ||
      suffix.startsWith("\t") ||
      suffix.startsWith("\n") ||
      suffix.startsWith("\r") ||
      suffix.startsWith("/")
    )
  ) {
    return false;
  }

  if (suffix.includes("=")) {
    return true;
  }

  const body = suffix.replace(/^\s+/, "").replace(/\/\s*$/, "").trimEnd();
  if (body === "") {
    return true;
  }

  // Single incomplete attribute name (` class`, ` data-id`) → HTML.
  if (/^[a-zA-Z_:][\w:.-]*$/.test(body)) {
    return true;
  }

  // Multiple tokens without `=` → prose (` the rest of this sentence`).
  return false;
};

// Positive classifier: strip only when `<…` at EOS looks like incomplete HTML.
const isPlausibleIncompleteHtmlTag = (text: string, index: number): boolean => {
  // `</…` is always an incomplete closing tag.
  if (text[index + 1] === "/") {
    return true;
  }

  const afterLt = text.slice(index + 1);
  const nameMatch = afterLt.match(htmlTagNamePattern);
  if (!nameMatch) {
    return false;
  }

  const tagName = nameMatch[0];
  const suffix = afterLt.slice(tagName.length);
  const prev = index === 0 ? undefined : text[index - 1];
  const prevIsIdentifier =
    prev !== undefined && identifierCharPattern.test(prev);

  // Whitespace / start / punctuation before `<`: same as before — strip.
  if (!prevIsIdentifier) {
    return true;
  }

  // Identifier before `<` (`a<b`, `Array<string`): only strip when the name
  // is a known HTML tag and the suffix is empty or attribute-like — so bare
  // mid-stream `a<b` heals, while `a<b the rest…` / generics stay put.
  if (!plausibleHtmlTags.has(tagName.toLowerCase())) {
    return false;
  }

  return looksLikeHtmlAttributeSuffix(suffix);
};

export const handleIncompleteHtmlTag = (text: string): string => {
  const match = text.match(incompleteHtmlTagPattern);

  if (!match || match.index === undefined) {
    return text;
  }

  // The pattern is leftmost-matching and always runs to the end of the string,
  // so every later < that starts a tag name is an equally valid candidate.
  // Walk forward until we find one that is not inside code or math: a comparison
  // operator such as \sum_{j<k} must not swallow the rest of the message.
  const checkMath = hasMathDelimiters(text);

  for (let index = match.index; index < text.length; index += 1) {
    if (text[index] !== "<" || !startsTag(text, index)) {
      continue;
    }

    if (!isPlausibleIncompleteHtmlTag(text, index)) {
      continue;
    }

    if (isInsideCodeBlock(text, index)) {
      continue;
    }

    if (checkMath && isWithinMathBlock(text, index)) {
      continue;
    }

    // Strip the incomplete tag and any trailing whitespace before it
    return text.substring(0, index).trimEnd();
  }

  return text;
};
