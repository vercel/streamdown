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

interface GateContext {
  firstClosedBy: Map<number, MarkerRun>;
  lastContent: number;
  previousRun: Map<number, MarkerRun>;
}

// All openers share the insertion point. Find the last content character once,
// rather than scanning overlapping suffixes even for runs that won't heal.
const prepareGates = (
  text: string,
  insertAt: number,
  match: DelimiterMatch
): GateContext => {
  let lastContent = insertAt - 1;
  while (
    lastContent >= 0 &&
    whitespaceOrMarkersPattern.test(text[lastContent])
  ) {
    lastContent -= 1;
  }
  // Word-chain gates inspect adjacent gaps, so those character scans do not
  // overlap. Index their run/pair lookups too, including for gated openers.
  const previousRun = new Map<number, MarkerRun>();
  for (let i = 1; i < match.runs.length; i += 1) {
    previousRun.set(match.runs[i].index, match.runs[i - 1]);
  }
  const firstClosedBy = new Map<number, MarkerRun>();
  for (const pair of match.pairs) {
    if (!firstClosedBy.has(pair.closer.index)) {
      firstClosedBy.set(pair.closer.index, pair.opener);
    }
  }
  return { firstClosedBy, lastContent, previousRun };
};

const asciiLetterOrDigitPattern = /^[A-Za-z0-9]$/;
const letterOrDigitPattern = /^[\p{L}\p{N}]/u;

const isLetterOrDigit = (char: string): boolean =>
  asciiLetterOrDigitPattern.test(char);

// An asterisk after an ASCII letter or digit opens only to continue a chain of
// emphasis in that word, so hello*world, 2**3 and A*算法 stay literal while
// languages written without spaces still heal. A chain whose first pair also
// opened inside a word, as in M*A*S*H, is literal too.
const opensColdInWord = (
  text: string,
  run: MarkerRun,
  gates: GateContext
): boolean => {
  if (
    !(
      run.marker === "*" &&
      isLetterOrDigit(text[run.index - 1] ?? "") &&
      letterOrDigitPattern.test(
        text.slice(run.index + run.length, run.index + run.length + 2)
      )
    )
  ) {
    return false;
  }
  const previous = gates.previousRun.get(run.index);
  if (
    !(
      previous?.marker === "*" &&
      [...text.slice(previous.index + previous.length, run.index)].every(
        isLetterOrDigit
      )
    )
  ) {
    return true;
  }
  const closed = gates.firstClosedBy.get(previous.index);
  return closed !== undefined && isLetterOrDigit(text[closed.index - 1] ?? "");
};

// Emphasis doesn't start with closing punctuation, so the * in (+, -, *, /)
// is a symbol
const closingPunctuationPattern = /^[,;]/;

const opensBeforeClosingPunctuation = (text: string, run: MarkerRun): boolean =>
  isWhitespaceChar(text[run.index - 1] ?? " ") &&
  closingPunctuationPattern.test(text[run.index + run.length] ?? "");

// Writing \** usually means a literal ** with a sloppy escape, so the rest of
// the run only closes if the author closes it
const followsEscapedMarker = (text: string, run: MarkerRun): boolean =>
  text[run.index - 1] === run.marker && isEscaped(text, run.index - 1);

// Authors close emphasis on the line that opens it, so an opener whose line
// ended open is usually code written outside a fence, like char *name
const contentPattern = /\S/g;

const lineEnded = (text: string, run: MarkerRun): boolean => {
  const newline = text.indexOf("\n", run.index + run.length);
  if (newline === -1) {
    return false;
  }
  contentPattern.lastIndex = newline;
  return contentPattern.test(text);
};

const isGated = (text: string, run: MarkerRun, gates: GateContext): boolean =>
  run.index + run.length > gates.lastContent ||
  // Prose uses a single tilde for "approximately"
  (run.marker === "~" && run.count === 1) ||
  // Models write fill-in blanks as long underscore runs, like Name: ______
  (run.marker === "_" && run.length >= 4) ||
  opensColdInWord(text, run, gates) ||
  opensBeforeClosingPunctuation(text, run) ||
  followsEscapedMarker(text, run);

interface HealContext {
  base: HealBase;
  flags: EmphasisFlags;
  gates: GateContext;
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

// A run longer than this is a divider or filler, not emphasis an author is
// still typing, and searching a closer for it is quadratic in its length
const MAX_DELIMITER_RUN = 16;

// How much matching one text's heal may do, counted in delimiter runs
// rematched, since every attempt rematches the whole block. Real text spends
// a few hundred; past this the markers are literal text and the input is
// returned unchanged rather than stalling the render.
const MAX_HEAL_WORK = 250_000;

interface Heal {
  closers: string;
  literal: number;
  targets: number[];
}

interface HealBudget {
  remaining: number;
}

// Charges one rematch of the block, false once the budget is spent
const spend = (budget: HealBudget, context: HealContext): boolean => {
  budget.remaining -= context.base.runs.length + 1;
  return budget.remaining >= 0;
};

// The candidate that leaves the fewest markers literal, or undefined when
// none closes the targets or the search runs past its budget
const bestCandidate = (
  context: HealContext,
  budget: HealBudget,
  heal: Heal,
  targets: number[],
  candidates: readonly string[]
): Heal | undefined => {
  const targetSet = new Set(targets);
  let found: Heal | undefined;
  for (const candidate of candidates) {
    if (!spend(budget, context)) {
      return;
    }
    const literal = literalAfterHeal(
      context.match,
      context.literal,
      context.base,
      heal.closers + candidate,
      targetSet
    );
    if (literal !== undefined && (!found || literal < found.literal)) {
      found = { closers: heal.closers + candidate, literal, targets };
    }
  }
  return found;
};

// Closers for a group of open runs, innermost first, where up to `reusable`
// markers of the first closer come from a literal run already in the text.
// Undefined when the group is too long to search: its markers are literal.
const closerCandidates = (
  group: MarkerRun[],
  reusable: number
): string[] | undefined => {
  const [first] = group;
  let own = first.marker.repeat(first.count - reusable);
  let uniform = true;
  for (const run of group.slice(1)) {
    own += run.marker.repeat(run.count);
    uniform &&= run.marker === first.marker;
  }
  if (own.length > MAX_DELIMITER_RUN) {
    return;
  }
  // Closers for openers of one marker merge into a single run, which the rule
  // of 3 may let close them all only at another length
  if (uniform) {
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
  open: readonly MarkerRun[],
  budget: HealBudget
): Heal | undefined => {
  const { flags, gates, text, trailing } = context;
  const runs: MarkerRun[] = [];
  for (const run of open) {
    // Dividers and disabled kinds can't heal, and need no gating work.
    if (run.length > MAX_DELIMITER_RUN || !flags[flagFor(run)]) {
      continue;
    }
    if (isGated(text, run, gates)) {
      continue;
    }
    runs.push(run);
    if (runs.length > MAX_OPEN_RUNS) {
      return start;
    }
  }
  // Openers on ended lines still count as duplicates, which mark the markers
  // on later lines as literal too
  const healable = withoutDuplicates(runs)?.filter(
    (run) => !lineEnded(text, run)
  );
  if (healable === undefined) {
    return start;
  }

  // Undefined when the search runs past its budget; false when none closed.
  const tryGroup = (heal: Heal, group: MarkerRun[]): boolean | undefined => {
    const [first] = group;
    const targets = [...heal.targets, ...group.map((run) => run.index)];
    // A literal run the first closer would extend already supplies markers
    const reusable =
      heal.closers === "" && trailing?.marker === first.marker
        ? Math.min(trailing.count, first.count - 1)
        : 0;
    const candidates = closerCandidates(group, reusable);
    if (!candidates) {
      return false;
    }
    const found = bestCandidate(context, budget, heal, targets, candidates);
    if (found === undefined && budget.remaining < 0) {
      return;
    }
    if (found) {
      Object.assign(heal, found);
    }
    return found !== undefined;
  };

  // Closing one run can strand another behind the rule of 3 or nest it
  // inside the same emphasis, so the greedy pass runs over every subset
  const closeAll = (chosen: MarkerRun[]): Heal | undefined => {
    const heal = { ...start, targets: [...start.targets] };

    for (let i = 0; i < chosen.length; i += 1) {
      if (i < chosen.length - 1) {
        const closed = tryGroup(heal, chosen.slice(i));
        if (closed === undefined) {
          return;
        }
        if (closed) {
          break;
        }
      }
      if (tryGroup(heal, [chosen[i]]) === undefined) {
        return;
      }
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
      if (!heal) {
        return;
      }
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
  budget: HealBudget,
  targets: number[] = []
): Heal | undefined => {
  let heal = extendHeal(
    context,
    { closers: "", literal: context.literal, targets },
    open,
    budget
  );
  while (heal && heal.closers !== "") {
    if (!spend(budget, context)) {
      return;
    }
    const reopened = matchHealed(context.base, heal.closers).open.filter(
      (run) => run.index < context.insertAt
    );
    const next = extendHeal(context, heal, reopened, budget);
    if (!next || next.closers === heal.closers) {
      heal = next;
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
    gates: prepareGates(text, insertAt, match),
    insertAt,
    literal: match.literal,
    match,
    text,
    trailing,
  };
  const budget = { remaining: MAX_HEAL_WORK };
  let heal = healFrom(context, match.open, budget);

  // A trailing run that closes something may instead be literal text, with
  // the runs open before it still needing closers
  if (trailing && trailing.count < trailing.length) {
    const prefix = matchDelimiterRuns(
      text.slice(0, trailing.index),
      flags.inlineMath
    );
    const asText = { ...trailing, count: trailing.length };
    const streaming = trailing.count > 0 || trailing.closesPartially;
    const alternateMatch = { ...prefix, runs: [...prefix.runs, asText] };
    const alternative = healFrom(
      {
        ...context,
        gates: prepareGates(text, insertAt, alternateMatch),
        literal: prefix.literal + asText.count,
        match: alternateMatch,
        trailing: asText,
      },
      prefix.open,
      budget,
      streaming ? [] : [trailing.index]
    );
    if (!alternative) {
      return text;
    }
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
    if (heal && alternative.literal < heal.literal && keepsAuthoredRuns) {
      heal = alternative;
    }
  }

  // A search past the budget means the markers are literal text
  return heal ? insertAtPoint(text, insertAt, heal.closers) : text;
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
