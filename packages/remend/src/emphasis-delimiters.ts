import { findInlineBlockStart } from "./inline-block";
import {
  getScan,
  inHtmlTagAt,
  inLinkUrlAt,
  inMathAt,
  isEscaped,
  isFenceAt,
  REGION,
  type TextScan,
} from "./scan";
import { isWhitespaceChar } from "./utils";

export type EmphasisMarker = "*" | "_" | "~";

const MARKERS: readonly string[] = ["*", "_", "~"];

export interface MarkerRun {
  /** Whether the last opener this run closed is still partly open */
  closesPartially: boolean;
  /** Markers still unmatched */
  count: number;
  /** Index of the run's first unescaped marker */
  index: number;
  /** Unescaped length of the run before any were matched */
  length: number;
  marker: EmphasisMarker;
}

interface DelimiterRun extends MarkerRun {
  canClose: boolean;
  canOpen: boolean;
  nextChar: string;
  pairsClosed: number;
  pairsOpened: number;
  prevChar: string;
  /** Start of the link label holding the run, or -1 outside any label */
  scope: number;
}

interface DelimiterPair {
  closer: DelimiterRun;
  opener: DelimiterRun;
  used: number;
}

export interface DelimiterMatch {
  /** Markers that render as literal text */
  literal: number;
  /** Runs still open outside link labels, innermost first */
  open: MarkerRun[];
  pairs: DelimiterPair[];
  runs: MarkerRun[];
}

// Flanking compares whole characters, so a surrogate pair counts as one
const charBefore = (text: string, i: number): string => {
  if (i <= 0) {
    return "";
  }
  const code = text.charCodeAt(i - 1);
  return code >= 0xdc_00 && code <= 0xdf_ff && i >= 2
    ? text.slice(i - 2, i)
    : text[i - 1];
};

const charAt = (text: string, i: number): string =>
  i < text.length ? String.fromCodePoint(text.codePointAt(i) ?? 0) : "";

// The start and end of the text count as whitespace for flanking
const isWhitespaceOrEdge = (char: string): boolean =>
  char === "" || isWhitespaceChar(char);

const punctuationPattern = /[\p{P}\p{S}]/u;

const isPunctuationChar = (char: string): boolean =>
  char !== "" && punctuationPattern.test(char);

// Flanking per CommonMark, with the stricter underscore rules: a run that
// flanks on both sides opens only after punctuation and closes only before
// punctuation, so word-internal runs (snake__case) can't open or close.
// Tildes follow the asterisk rules, and a tilde run longer than 2 is inert.
const applyFlanking = (run: DelimiterRun): void => {
  const { marker, nextChar, prevChar } = run;
  // micromark treats every attention marker (* _ ~) as flanking punctuation,
  // so an asterisk or underscore run beside one can open or close that side
  const besideMarker = (char: string): boolean =>
    marker !== "~" && MARKERS.includes(char);
  const leftFlanking =
    besideMarker(nextChar) ||
    !(
      isWhitespaceOrEdge(nextChar) ||
      (isPunctuationChar(nextChar) &&
        !isWhitespaceOrEdge(prevChar) &&
        !isPunctuationChar(prevChar))
    );
  const rightFlanking =
    besideMarker(prevChar) ||
    !(
      isWhitespaceOrEdge(prevChar) ||
      (isPunctuationChar(prevChar) &&
        !isWhitespaceOrEdge(nextChar) &&
        !isPunctuationChar(nextChar))
    );
  if (marker === "_") {
    run.canClose =
      rightFlanking && (!leftFlanking || isPunctuationChar(nextChar));
    run.canOpen =
      leftFlanking && (!rightFlanking || isPunctuationChar(prevChar));
    return;
  }
  const inert = marker === "~" && run.length > 2;
  run.canClose = rightFlanking && !inert;
  run.canOpen = leftFlanking && !inert;
};

const createRun = (
  marker: EmphasisMarker,
  index: number,
  length: number,
  prevChar: string,
  nextChar: string,
  scope: number
): DelimiterRun => {
  const run = {
    canClose: false,
    canOpen: false,
    closesPartially: false,
    count: length,
    index,
    length,
    marker,
    nextChar,
    pairsClosed: 0,
    pairsOpened: 0,
    prevChar,
    scope,
  };
  applyFlanking(run);
  return run;
};

const findOpenInlineMath = (scan: TextScan, inlineMath: boolean): number => {
  const { text } = scan;
  let start = text.length;
  while (start > 0 && inMathAt(scan, start - 1, inlineMath)) {
    start -= 1;
  }
  const isInlineDollar =
    start < text.length && text[start - 1] === "$" && text[start] !== "$";
  return isInlineDollar ? start : text.length;
};

// An unclosed code span or inline math span renders as literal text, so its
// markers still count
const isProseAt = (
  scan: TextScan,
  i: number,
  openMath: number,
  inlineMath: boolean
): boolean =>
  (scan.regions[i] === REGION.PROSE ||
    scan.regions[i] === REGION.CODE_SPAN_OPEN) &&
  !(i < openMath && inMathAt(scan, i, inlineMath)) &&
  !inLinkUrlAt(scan, i) &&
  !inHtmlTagAt(scan, i);

interface LinkLabel {
  end: number;
  start: number;
}

// Emphasis inside a completed link's text resolves on its own, so the label
// walls its runs off from the rest of the block
const findLinkLabels = (
  scan: TextScan,
  from: number,
  openMath: number,
  inlineMath: boolean
): LinkLabel[] => {
  const { text } = scan;
  const labels: LinkLabel[] = [];
  const openers: { active: boolean; start: number }[] = [];
  for (let i = from; i < text.length; i += 1) {
    const char = text[i];
    if (
      (char !== "[" && char !== "]") ||
      isEscaped(text, i) ||
      !isProseAt(scan, i, openMath, inlineMath)
    ) {
      continue;
    }
    if (char === "[") {
      openers.push({ active: true, start: i });
      continue;
    }
    const opener = openers.pop();
    if (opener?.active && text[i + 1] === "(" && inLinkUrlAt(scan, i + 2)) {
      labels.push({ end: i, start: opener.start });
      // Links cannot contain links, so a link deactivates every bracket that could enclose it
      if (text[opener.start - 1] !== "!" || isEscaped(text, opener.start - 1)) {
        for (const outer of openers) {
          outer.active = false;
        }
      }
    }
  }
  return labels;
};

const scopeOf = (labels: readonly LinkLabel[], index: number): number => {
  let scope = -1;
  for (const label of labels) {
    if (label.start < index && index < label.end && label.start > scope) {
      scope = label.start;
    }
  }
  return scope;
};

const collectDelimiterRuns = (
  scan: TextScan,
  from: number,
  inlineMath: boolean
): DelimiterRun[] => {
  const { text } = scan;
  const runs: DelimiterRun[] = [];
  const openMath = findOpenInlineMath(scan, inlineMath);
  const labels = findLinkLabels(scan, from, openMath, inlineMath);
  const isRunMarker = (i: number, marker: string): boolean =>
    text[i] === marker && isProseAt(scan, i, openMath, inlineMath);

  for (let i = from; i < text.length; i += 1) {
    const marker = text[i];
    if (!(MARKERS.includes(marker) && isRunMarker(i, marker))) {
      continue;
    }

    let end = i + 1;
    while (end < text.length && isRunMarker(end, marker)) {
      end += 1;
    }

    // A backslash escapes the run's first marker, which stays literal
    // punctuation before the rest of the run
    const escaped = isEscaped(text, i);
    const start = escaped ? i + 1 : i;
    if (end > start) {
      runs.push(
        createRun(
          marker as EmphasisMarker,
          start,
          end - start,
          escaped ? marker : charBefore(text, i),
          charAt(text, end),
          scopeOf(labels, start)
        )
      );
    }
    i = end - 1;
  }

  return runs;
};

// The "rule of 3": when either run can both open and close, they match only
// if their combined length is not a multiple of 3, unless both lengths are.
// Lengths are what remains of each run after earlier partial matches.
const violatesRuleOfThree = (
  opener: DelimiterRun,
  closer: DelimiterRun
): boolean =>
  (closer.canOpen || opener.canClose) &&
  (opener.count + closer.count) % 3 === 0 &&
  !(opener.count % 3 === 0 && closer.count % 3 === 0);

const canMatch = (opener: DelimiterRun, closer: DelimiterRun): boolean => {
  if (opener.marker !== closer.marker) {
    return false;
  }
  if (closer.marker === "~") {
    return opener.count === closer.count;
  }
  return !violatesRuleOfThree(opener, closer);
};

const matchCloser = (
  stack: DelimiterRun[],
  floor: number,
  closer: DelimiterRun,
  pairs: DelimiterPair[]
): void => {
  while (closer.count > 0) {
    let openerIndex = stack.length - 1;
    while (openerIndex >= floor && !canMatch(stack[openerIndex], closer)) {
      openerIndex -= 1;
    }
    if (openerIndex < floor) {
      return;
    }

    const opener = stack[openerIndex];
    let used = 1;
    if (closer.marker === "~") {
      used = closer.count;
    } else if (opener.count >= 2 && closer.count >= 2) {
      used = 2;
    }
    opener.count -= used;
    closer.count -= used;
    opener.pairsOpened += 1;
    closer.pairsClosed += 1;
    closer.closesPartially = opener.count > 0;
    pairs.push({ closer, opener, used });
    stack.length = opener.count > 0 ? openerIndex + 1 : openerIndex;
  }
};

// Pairs an earlier pass matched wall off the runs between them, so a run
// inside a pair can't match one outside it.
const matchPass = (
  runs: DelimiterRun[],
  inPass: (run: DelimiterRun) => boolean,
  pairs: DelimiterPair[]
): DelimiterRun[] => {
  const stack: DelimiterRun[] = [];
  const floors: number[] = [];

  for (const run of runs) {
    if (!inPass(run)) {
      for (let i = 0; i < run.pairsClosed; i += 1) {
        stack.length = floors.pop() ?? 0;
      }
      for (let i = 0; i < run.pairsOpened; i += 1) {
        floors.push(stack.length);
      }
      continue;
    }
    if (run.canClose) {
      matchCloser(stack, floors.at(-1) ?? 0, run, pairs);
    }
    if (run.canOpen && run.count > 0) {
      stack.push(run);
    }
  }

  return stack;
};

const isTilde = (run: DelimiterRun): boolean => run.marker === "~";
const isAttention = (run: DelimiterRun): boolean => run.marker !== "~";

// micromark resolves attention and strikethrough in the order each first
// appears in the block, link text included, and an inert tilde run never
// reaches the strikethrough resolver
const passOrder = (runs: readonly DelimiterRun[]) => {
  const first = runs.find((run) => !isTilde(run) || run.length <= 2);
  return first && isTilde(first)
    ? [isTilde, isAttention]
    : [isAttention, isTilde];
};

const matchRuns = (runs: DelimiterRun[]): DelimiterMatch => {
  const scopes = new Map<number, DelimiterRun[]>();
  for (const run of runs) {
    const scope = scopes.get(run.scope);
    if (scope) {
      scope.push(run);
    } else {
      scopes.set(run.scope, [run]);
    }
  }
  const pairs: DelimiterPair[] = [];
  const passes = passOrder(runs);
  let open: DelimiterRun[] = [];
  for (const [scope, scoped] of scopes) {
    const left = passes.flatMap((inPass) => matchPass(scoped, inPass, pairs));
    if (scope === -1) {
      open = left;
    }
  }

  return {
    literal: runs.reduce((sum, run) => sum + run.count, 0),
    open: open.sort((a, b) => b.index - a.index),
    pairs,
    runs,
  };
};

/**
 * Matches the delimiter runs of the text's last inline block as micromark
 * does, per CommonMark and GFM strikethrough
 */
/** Matches the runs of the text's last block, where `inlineMath` decides if a lone `$` opens math */
export const matchDelimiterRuns = (
  text: string,
  inlineMath: boolean
): DelimiterMatch => {
  const scan = getScan(text);
  return matchRuns(
    collectDelimiterRuns(scan, findInlineBlockStart(scan), inlineMath)
  );
};

/** The authored text's runs, reused to match each candidate heal */
export interface HealBase {
  inlineMath: boolean;
  insertAt: number;
  runs: readonly DelimiterRun[];
  /** Whether closers would land where runs aren't collected */
  slow: boolean;
  text: string;
}

export const prepareHeal = (
  text: string,
  insertAt: number,
  inlineMath: boolean
): HealBase => {
  const scan = getScan(text);
  const from = findInlineBlockStart(scan);
  return {
    inlineMath,
    insertAt,
    runs: collectDelimiterRuns(scan, from, inlineMath),
    // Past a trailing blank line the closers would start a block of their
    // own, and inside a tag, math or a fence their markers aren't collected
    slow:
      from > insertAt ||
      (insertAt > 0 &&
        (inHtmlTagAt(scan, insertAt - 1) ||
          inMathAt(scan, insertAt - 1, inlineMath) ||
          isFenceAt(scan, insertAt - 1))),
    text,
  };
};

const insertClosers = (base: HealBase, closers: string): string =>
  base.text.slice(0, base.insertAt) + closers + base.text.slice(base.insertAt);

// Only the runs beside the insertion point change, so just those are rebuilt
export const matchHealed = (
  base: HealBase,
  closers: string
): DelimiterMatch => {
  if (base.slow) {
    return matchDelimiterRuns(insertClosers(base, closers), base.inlineMath);
  }
  const { insertAt, text } = base;
  const runs = base.runs.map((run) => ({
    ...run,
    closesPartially: false,
    count: run.length,
    pairsClosed: 0,
    pairsOpened: 0,
  }));
  const after = charAt(text, insertAt);
  const charAfter = (i: number): string =>
    i < closers.length ? closers[i] : after;

  let start = 0;
  const last = runs.at(-1);
  if (last && last.scope === -1 && last.index + last.length === insertAt) {
    while (closers[start] === last.marker) {
      start += 1;
    }
    last.length += start;
    last.count = last.length;
    last.nextChar = charAfter(start);
    applyFlanking(last);
  }

  while (start < closers.length) {
    let end = start + 1;
    while (closers[end] === closers[start]) {
      end += 1;
    }
    runs.push(
      createRun(
        closers[start] as EmphasisMarker,
        insertAt + start,
        end - start,
        start === 0 ? charBefore(text, insertAt) : closers[start - 1],
        charAfter(end),
        -1
      )
    );
    start = end;
  }

  return matchRuns(runs);
};

const kindOf = (pair: DelimiterPair): string =>
  pair.opener.marker === "~" ? "~" : pair.opener.marker + pair.used;

const parentOf = (
  pairs: readonly DelimiterPair[],
  pair: DelimiterPair
): DelimiterPair | undefined => {
  let parent: DelimiterPair | undefined;
  for (const other of pairs) {
    if (
      other.opener.index < pair.opener.index &&
      other.closer.index >= pair.closer.index &&
      (!parent ||
        other.opener.index > parent.opener.index ||
        (other.opener.index === parent.opener.index &&
          other.closer.index < parent.closer.index))
    ) {
      parent = other;
    }
  }
  return parent;
};

// An authored pair whose opener follows punctuation, as in **注意：**这是, is
// usually a closer that failed flanking, so emphasis around it is intended
const opensAfterPunctuation = (pair: DelimiterPair): boolean =>
  isPunctuationChar(pair.opener.prevChar) &&
  !isWhitespaceOrEdge(pair.opener.nextChar) &&
  !isPunctuationChar(pair.opener.nextChar);

// Authors don't nest emphasis directly inside the same emphasis, so a heal
// that needs that is closing runs written as literal text
const nestsSameKind = (match: DelimiterMatch, insertAt: number): boolean => {
  const healed = (pair: DelimiterPair): boolean =>
    pair.closer.index + pair.closer.length > insertAt;
  return match.pairs.some((pair) => {
    const parent = parentOf(match.pairs, pair);
    return (
      parent !== undefined &&
      kindOf(parent) === kindOf(pair) &&
      (healed(pair) || (healed(parent) && !opensAfterPunctuation(pair)))
    );
  });
};

const lineContentPattern = /[^\s*_~>+-]/;

// Closers on a line with nothing else would turn it into a thematic break or
// a fence
const leavesLineBare = (base: HealBase): boolean => {
  const lineStart = base.text.lastIndexOf("\n", base.insertAt - 1) + 1;
  return !lineContentPattern.test(base.text.slice(lineStart, base.insertAt));
};

/**
 * The healed text's literal marker count, or undefined when healing left a
 * target opener open, left a marker it added literal, changed how many
 * markers any other run leaves unmatched, nested emphasis directly inside
 * the same emphasis, or closed fewer literal markers than it added
 */
export const literalAfterHeal = (
  before: DelimiterMatch,
  literalBefore: number,
  base: HealBase,
  closers: string,
  targets: ReadonlySet<number>
): number | undefined => {
  if (leavesLineBare(base)) {
    return undefined;
  }
  const after = matchHealed(base, closers);
  if (after.literal > literalBefore - closers.length) {
    return undefined;
  }
  const countBefore = new Map(before.runs.map((run) => [run.index, run.count]));
  const matchesOnlyTargets = after.runs.every((run) => {
    if (targets.has(run.index) || run.index + run.length > base.insertAt) {
      return run.count === 0;
    }
    return run.count === (countBefore.get(run.index) ?? 0);
  });
  return matchesOnlyTargets && !nestsSameKind(after, base.insertAt)
    ? after.literal
    : undefined;
};
