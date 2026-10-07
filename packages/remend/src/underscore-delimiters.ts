import {
  getScan,
  inHtmlTagAt,
  inLinkUrlAt,
  inMathAt,
  isEscaped,
  REGION,
  type TextScan,
} from "./scan";
import { isWhitespaceChar, isWordChar } from "./utils";

/** An underscore delimiter run left open at the end of the text */
export interface OpenUnderscoreRun {
  /** Underscores still unmatched */
  count: number;
  /** Unescaped length of the run before any were matched */
  length: number;
}

interface DelimiterRun extends OpenUnderscoreRun {
  canClose: boolean;
  canOpen: boolean;
}

// The start and end of the text count as whitespace for flanking
const isWhitespaceOrEdge = (char: string): boolean =>
  char === "" || isWhitespaceChar(char);

const isPunctuationChar = (char: string): boolean =>
  char === "_" || !(isWhitespaceOrEdge(char) || isWordChar(char));

// Flanking per CommonMark, with the stricter underscore rules: a run that
// flanks on both sides opens only after punctuation and closes only before
// punctuation, so word-internal runs (snake__case) can't open or close
const toDelimiterRun = (
  text: string,
  index: number,
  end: number,
  prevChar: string
): DelimiterRun => {
  const nextChar = end < text.length ? text[end] : "";
  const leftFlanking = !(
    isWhitespaceOrEdge(nextChar) ||
    (isPunctuationChar(nextChar) &&
      !isWhitespaceOrEdge(prevChar) &&
      !isPunctuationChar(prevChar))
  );
  const rightFlanking = !(
    isWhitespaceOrEdge(prevChar) ||
    (isPunctuationChar(prevChar) &&
      !isWhitespaceOrEdge(nextChar) &&
      !isPunctuationChar(nextChar))
  );
  const length = end - index;
  return {
    canClose: rightFlanking && (!leftFlanking || isPunctuationChar(nextChar)),
    canOpen: leftFlanking && (!rightFlanking || isPunctuationChar(prevChar)),
    count: length,
    length,
  };
};

const isSkippedUnderscore = (scan: TextScan, i: number): boolean =>
  scan.text[i] !== "_" ||
  scan.regions[i] !== REGION.PROSE ||
  inMathAt(scan, i) ||
  inLinkUrlAt(scan, i) ||
  inHtmlTagAt(scan, i);

const collectDelimiterRuns = (scan: TextScan): DelimiterRun[] => {
  const { text } = scan;
  const runs: DelimiterRun[] = [];
  let i = text.indexOf("_");

  while (i !== -1) {
    if (isSkippedUnderscore(scan, i)) {
      i = text.indexOf("_", i + 1);
      continue;
    }

    let end = i + 1;
    while (end < text.length && !isSkippedUnderscore(scan, end)) {
      end += 1;
    }

    // A backslash escapes the run's first underscore, which stays literal
    // punctuation before the rest of the run
    if (isEscaped(text, i)) {
      if (end - i > 1) {
        runs.push(toDelimiterRun(text, i + 1, end, "_"));
      }
    } else {
      runs.push(toDelimiterRun(text, i, end, i > 0 ? text[i - 1] : ""));
    }
    i = text.indexOf("_", end);
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

// Matches a closing run against the stack until it runs out of underscores
// or openers, popping every opener it passes
const matchCloser = (stack: DelimiterRun[], closer: DelimiterRun): void => {
  while (closer.count > 0) {
    let openerIndex = stack.length - 1;
    while (
      openerIndex >= 0 &&
      violatesRuleOfThree(stack[openerIndex], closer)
    ) {
      openerIndex -= 1;
    }
    if (openerIndex < 0) {
      return;
    }

    const opener = stack[openerIndex];
    const used = opener.count >= 2 && closer.count >= 2 ? 2 : 1;
    opener.count -= used;
    closer.count -= used;
    stack.length = opener.count > 0 ? openerIndex + 1 : openerIndex;
  }
};

// Runs the CommonMark emphasis algorithm over the text's underscore runs,
// leaving each run's unmatched count and the openers still open
const matchUnderscoreRuns = (
  text: string
): { runs: DelimiterRun[]; stack: DelimiterRun[] } => {
  const runs = collectDelimiterRuns(getScan(text));
  const stack: DelimiterRun[] = [];

  for (const run of runs) {
    if (run.canClose) {
      matchCloser(stack, run);
    }
    if (run.canOpen && run.count > 0) {
      stack.push(run);
    }
  }

  return { runs, stack };
};

/** The underscore openers the text leaves unmatched, outermost first */
export const findOpenUnderscoreRuns = (text: string): OpenUnderscoreRun[] =>
  matchUnderscoreRuns(text).stack;

// Underscores that render as literal text: openers still open, openers a
// closer passed over, and closers left over
const countLiteralUnderscores = (text: string): number =>
  matchUnderscoreRuns(text).runs.reduce((sum, run) => sum + run.count, 0);

/**
 * Whether every underscore that healing added to the text matched one the
 * text left literal. An added closer can fail to match, for example under
 * the rule of 3.
 */
export const closesAddedUnderscores = (
  text: string,
  healed: string
): boolean => {
  // Scan the text first, while the scan cache still holds it
  const literal = countLiteralUnderscores(text);
  return (
    countLiteralUnderscores(healed) <= literal - (healed.length - text.length)
  );
};
