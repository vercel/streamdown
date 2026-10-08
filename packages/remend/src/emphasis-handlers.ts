import {
  type DelimiterMatch,
  type HealBase,
  literalAfterHeal,
  type MarkerRun,
  matchDelimiterRuns,
  matchHealed,
  prepareHeal,
} from "./emphasis-delimiters";
import { handleIncompleteInlineCode } from "./inline-code-handler";
import { whitespaceOrMarkersPattern } from "./patterns";
import { getScan, isEscaped } from "./scan";
import { isWhitespaceChar } from "./utils";

export interface EmphasisFlags {
  bold: boolean;
  boldItalic: boolean;
  inlineCode: boolean;
  /** Whether a lone `$` opens math, which hides the markers inside it */
  inlineMath: boolean;
  italic: boolean;
  strikethrough: boolean;
}

const flagFor = (run: MarkerRun): keyof EmphasisFlags => {
  if (run.marker === "~") {
    return "strikethrough";
  }
  if (run.count >= 3) {
    return "boldItalic";
  }
  return run.count === 2 && run.marker === "*" ? "bold" : "italic";
};

// Closers go before trailing whitespace, which would stop them from closing,
// and before a trailing backslash, which would escape them
const findInsertionPoint = (text: string): number => {
  let end = text.length;
  while (end > 0 && isWhitespaceChar(text[end - 1])) {
    end -= 1;
  }
  return text[end - 1] === "\\" && !isEscaped(text, end - 1) ? end - 1 : end;
};

const insertAtPoint = (text: string, at: number, closers: string): string =>
  closers === "" ? text : text.slice(0, at) + closers + text.slice(at);

const hasContentBefore = (
  text: string,
  run: MarkerRun,
  insertAt: number
): boolean => {
  const content = text.slice(run.index + run.length, insertAt);
  return content !== "" && !whitespaceOrMarkersPattern.test(content);
};

const asciiLetterOrDigitPattern = /^[A-Za-z0-9]$/;
const letterOrDigitPattern = /^[\p{L}\p{N}]/u;

const isLetterOrDigit = (char: string): boolean =>
  asciiLetterOrDigitPattern.test(char);

// An asterisk after an ASCII letter or digit opens only to continue a chain of
// emphasis in that word, so hello*world, 2**3 and A*算法 stay literal while
// languages written without spaces still heal
const opensColdInWord = (
  text: string,
  run: MarkerRun,
  previous: MarkerRun | undefined
): boolean =>
  run.marker === "*" &&
  isLetterOrDigit(text[run.index - 1] ?? "") &&
  letterOrDigitPattern.test(text.slice(run.index + run.length)) &&
  !(
    previous?.marker === "*" &&
    [...text.slice(previous.index + previous.length, run.index)].every(
      isLetterOrDigit
    )
  );

// Writing \** usually means a literal ** with a sloppy escape, so the rest of
// the run only closes if the author closes it
const followsEscapedMarker = (text: string, run: MarkerRun): boolean =>
  text[run.index - 1] === run.marker && isEscaped(text, run.index - 1);

const isGated = (
  text: string,
  run: MarkerRun,
  insertAt: number,
  previous: MarkerRun | undefined
): boolean =>
  !hasContentBefore(text, run, insertAt) ||
  // Prose uses a single tilde for "approximately"
  (run.marker === "~" && run.count === 1) ||
  // Models write fill-in blanks as long underscore runs, like Name: ______
  (run.marker === "_" && run.length >= 4) ||
  opensColdInWord(text, run, previous) ||
  followsEscapedMarker(text, run);

interface HealContext {
  base: HealBase;
  flags: EmphasisFlags;
  insertAt: number;
  literal: number;
  match: DelimiterMatch;
  text: string;
  /** The authored run the first closer would extend */
  trailing: MarkerRun | undefined;
}

// More open runs than nesting plausibly reaches means the markers are
// literal text, like a list of globs or footnote marks
const MAX_OPEN_RUNS = 4;

interface Heal {
  closers: string;
  literal: number;
  targets: number[];
}

// Closers for a group of open runs, innermost first, where up to `reusable`
// markers of the first closer come from a literal run already in the text
const closerCandidates = (group: MarkerRun[], reusable: number): string[] => {
  const [first] = group;
  const own =
    first.marker.repeat(first.count - reusable) +
    group
      .slice(1)
      .map((run) => run.marker.repeat(run.count))
      .join("");
  // Closers for openers of one marker merge into a single run, which the rule
  // of 3 may let close them all only at another length
  if ([...own].every((char) => char === first.marker)) {
    return Array.from({ length: own.length + reusable + 2 }, (_, i) =>
      first.marker.repeat(i + 1)
    );
  }
  return Array.from(
    { length: reusable + 1 },
    (_, i) => first.marker.repeat(i) + own
  );
};

// Two open runs of one kind are literal text, like globs or _id, _rev.
// When only double * or _ runs are open they pair off instead, since a closer
// that failed flanking in **Note:**text leaves an opener behind it that the
// author may still close. Tildes stay strict because GFM matches them in a
// separate pass.
const withoutDuplicates = (
  runs: readonly MarkerRun[]
): MarkerRun[] | undefined => {
  const byKind = new Map<string, MarkerRun[]>();
  for (const run of runs) {
    const kind = run.marker + run.count;
    byKind.set(kind, [...(byKind.get(kind) ?? []), run]);
  }
  // Closing another kind can bury one run of a pair and expose the other
  if (byKind.size > 1 && byKind.size < runs.length) {
    return;
  }
  const healable = new Set<MarkerRun>();
  for (const group of byKind.values()) {
    if (group.length > 1 && (group[0].count === 1 || group[0].marker === "~")) {
      return;
    }
    if (group.length % 2 === 1) {
      healable.add(
        group.reduce((last, run) => (run.index > last.index ? run : last))
      );
    }
  }
  return runs.filter((run) => healable.has(run));
};

// A closer's flanking can depend on the closers after it, so each step tries
// every remaining closer at once before trying it alone
const extendHeal = (
  context: HealContext,
  start: Heal,
  open: readonly MarkerRun[]
): Heal => {
  const { flags, insertAt, text, trailing } = context;
  const runs: MarkerRun[] = [];
  for (const run of open) {
    const previous = context.match.runs.findLast(
      (other) => other.index < run.index
    );
    if (isGated(text, run, insertAt, previous)) {
      continue;
    }
    if (flags[flagFor(run)]) {
      runs.push(run);
    }
    if (runs.length > MAX_OPEN_RUNS) {
      return start;
    }
  }
  const healable = withoutDuplicates(runs);
  if (healable === undefined) {
    return start;
  }

  // Closing one run can strand another behind the rule of 3 or nest it
  // inside the same emphasis, so the greedy pass runs over every subset
  const closeAll = (chosen: MarkerRun[]): Heal => {
    let heal = start;
    const tryGroup = (group: MarkerRun[]): boolean => {
      const [first] = group;
      const targets = [...heal.targets, ...group.map((run) => run.index)];
      const targetSet = new Set(targets);
      // A literal run the first closer would extend already supplies markers
      const reusable =
        heal.closers === "" && trailing?.marker === first.marker
          ? Math.min(trailing.count, first.count - 1)
          : 0;
      let found: Heal | undefined;
      for (const candidate of closerCandidates(group, reusable)) {
        const closers = heal.closers + candidate;
        const literal = literalAfterHeal(
          context.match,
          context.literal,
          context.base,
          closers,
          targetSet
        );
        if (literal !== undefined && (!found || literal < found.literal)) {
          found = { closers, literal, targets };
        }
      }
      if (found) {
        heal = found;
      }
      return found !== undefined;
    };

    for (let i = 0; i < chosen.length; i += 1) {
      if (i < chosen.length - 1 && tryGroup(chosen.slice(i))) {
        break;
      }
      tryGroup([chosen[i]]);
    }
    return heal;
  };

  // Largest subsets first, so a tie keeps the heal that closes more runs
  const subsets: MarkerRun[][] = [[]];
  for (const run of healable) {
    subsets.push(...subsets.map((set) => [...set, run]));
  }
  subsets.reverse();
  let best = start;
  for (const subset of subsets) {
    if (subset.length > 0) {
      const heal = closeAll(subset);
      if (heal.literal < best.literal) {
        best = heal;
      }
    }
  }
  return best;
};

// Closers can change how authored runs flank and leave one open, so healing
// repeats until a round adds nothing
const healFrom = (
  context: HealContext,
  open: readonly MarkerRun[],
  targets: number[] = []
): Heal => {
  let heal = extendHeal(
    context,
    { closers: "", literal: context.literal, targets },
    open
  );
  while (heal.closers !== "") {
    const reopened = matchHealed(context.base, heal.closers).open.filter(
      (run) => run.index < context.insertAt
    );
    const next = extendHeal(context, heal, reopened);
    if (next.closers === heal.closers) {
      break;
    }
    heal = next;
  }
  return heal;
};

const healEmphasis = (text: string, flags: EmphasisFlags): string => {
  const insertAt = findInsertionPoint(text);
  const match = matchDelimiterRuns(text, flags.inlineMath);
  const last = match.runs.at(-1);
  const trailing =
    last && last.index + last.length === insertAt ? last : undefined;
  const context = {
    base: prepareHeal(text, insertAt, flags.inlineMath),
    flags,
    insertAt,
    literal: match.literal,
    match,
    text,
    trailing,
  };
  let heal = healFrom(context, match.open);

  // A trailing run that closes something may instead be literal text, with
  // the runs open before it still needing closers
  if (trailing && trailing.count < trailing.length) {
    const prefix = matchDelimiterRuns(
      text.slice(0, trailing.index),
      flags.inlineMath
    );
    const asText = { ...trailing, count: trailing.length };
    const streaming = trailing.count > 0 || trailing.closesPartially;
    const alternative = healFrom(
      {
        ...context,
        literal: prefix.literal + asText.count,
        match: { ...prefix, runs: [...prefix.runs, asText] },
        trailing: asText,
      },
      prefix.open,
      streaming ? [] : [trailing.index]
    );
    // Reading the trailing run as text must not repair spans the author
    // already closed by re-pairing their runs
    const targets = new Set(alternative.targets);
    const healed = matchHealed(context.base, alternative.closers);
    const countBefore = new Map(
      match.runs.map((run) => [run.index, run.count])
    );
    const keepsAuthoredRuns = healed.runs.every(
      (run) =>
        run.index >= trailing.index ||
        targets.has(run.index) ||
        run.count === countBefore.get(run.index)
    );
    if (alternative.literal < heal.literal && keepsAuthoredRuns) {
      heal = alternative;
    }
  }

  return insertAtPoint(text, insertAt, heal.closers);
};

export const handleIncompleteEmphasis = (
  text: string,
  flags: EmphasisFlags
): string => {
  if (!(flags.inlineCode && getScan(text).openSpan)) {
    return healEmphasis(text, flags);
  }

  // Emphasis closers must land after the code span closes, so close it first
  // and keep that only when emphasis needed healing too
  const closed = handleIncompleteInlineCode(text);
  if (closed !== text) {
    const healed = healEmphasis(closed, flags);
    return healed === closed ? text : healed;
  }

  // A closer that breaks up a trailing backtick run would let the span close
  // after it, which would swallow the closer
  const healed = healEmphasis(text, flags);
  return handleIncompleteInlineCode(healed) === healed ? healed : text;
};
