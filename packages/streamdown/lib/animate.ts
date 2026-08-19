import type { Element, Node, Parent, Root, Text } from "hast";
import type { Pluggable } from "unified";
import { SKIP, visitParents } from "unist-util-visit-parents";

/**
 * Soft budget for how long a cascade may run ahead of wall-clock.
 * Fast streams compress their stagger to fit, instead of either:
 * - growing an unbounded opacity:0 queue, or
 * - truncating start times and re-introducing #482 overlap.
 *
 * When the budget is already exhausted mid-pass, later blocks keep a
 * {@link MIN_STAGGER_STEP_MS} floor so they still cascade (slight overshoot)
 * rather than all firing at once.
 */
export const MAX_ANIMATION_BACKLOG_MS = 320;

/**
 * Floor for per-word stagger under compression. Keeps multi-block passes
 * from collapsing to step=0 once the first block(s) consume the budget.
 */
export const MIN_STAGGER_STEP_MS = 4;

export interface ScheduleSlot {
  /** CSS delay (ms) for the first new word in this batch. */
  baseDelay: number;
  /** Effective stagger (ms) between words — may be < requested under load. */
  step: number;
}

/**
 * Shared wall-clock timeline that serializes stagger delays across blocks
 * and across streaming ticks — even when settled blocks are memoized.
 *
 * Render-pass protocol (driven by Streamdown):
 * 1. `beginPass(now)` once at the start of each React render
 * 2. each block's rehype plugin calls `take(wordCount, stagger, now)`
 * 3. `commitPass()` once in a layout effect after paint
 *
 * StrictMode / discarded-render safety is per-plugin via `mark`/`rewind`:
 * the first rehype run in a commit marks the cursor; a re-run rewinds
 * before taking again so delays stay identical.
 */
export interface AnimateTimeline {
  beginPass: (now: number) => void;
  commitPass: () => void;
  /** Snapshot of the working cursor (passNextStartAt). */
  mark: () => number;
  now: () => number;
  /** Restore the working cursor to a prior mark. */
  rewind: (mark: number) => void;
  take: (wordCount: number, stagger: number, now: number) => ScheduleSlot;
}

export interface CreateAnimateTimelineOptions {
  maxBacklogMs?: number;
  now?: () => number;
}

const defaultNow = (): number =>
  typeof performance === "undefined" ? Date.now() : performance.now();

export function createAnimateTimeline(
  options?: CreateAnimateTimelineOptions
): AnimateTimeline {
  const nowFn = options?.now ?? defaultNow;
  const maxBacklog = options?.maxBacklogMs ?? MAX_ANIMATION_BACKLOG_MS;

  /** Committed absolute time when the next word may start. */
  let committedNextStartAt = 0;
  /** Working absolute time for the in-flight pass. */
  let passNextStartAt = 0;

  return {
    now: nowFn,
    beginPass(now: number) {
      // Resume from the last commit, but never more than maxBacklog ahead of
      // wall-clock — drops debt from a previous pass that overshot via the
      // min-step floor so a fast stream stays caught up on the next tick.
      passNextStartAt = Math.min(
        Math.max(committedNextStartAt, now),
        now + maxBacklog
      );
    },
    mark() {
      return passNextStartAt;
    },
    rewind(m: number) {
      passNextStartAt = m;
    },
    take(wordCount: number, stagger: number, now: number): ScheduleSlot {
      if (wordCount <= 0) {
        return { baseDelay: 0, step: Math.max(0, stagger) };
      }

      const idealStep = Math.max(0, stagger);
      // Floor only applies when the user asked for a non-zero stagger.
      const minStep =
        idealStep === 0 ? 0 : Math.min(idealStep, MIN_STAGGER_STEP_MS);

      // Ideal start: after everything already scheduled this pass.
      const startAt = Math.max(passNextStartAt, now);
      const budgetEnd = now + maxBacklog;
      const idealLast = startAt + Math.max(0, wordCount - 1) * idealStep;

      let step = idealStep;
      if (idealLast > budgetEnd && wordCount > 1) {
        if (startAt < budgetEnd) {
          // Fits the batch into the remaining budget, not below minStep.
          // May overshoot budgetEnd slightly when minStep forces it.
          const span = budgetEnd - startAt;
          step = Math.max(minStep, span / (wordCount - 1));
        } else {
          // Budget already exhausted by earlier blocks in this pass —
          // keep ordering with a minimum cascade instead of step=0.
          step = minStep;
        }
      }

      const baseDelay = Math.max(0, Math.round(startAt - now));
      passNextStartAt = startAt + wordCount * step;
      return { baseDelay, step };
    },
    commitPass() {
      committedNextStartAt = passNextStartAt;
    },
  };
}

export interface AnimatePlugin {
  /**
   * Commit the last rehype char count so the *next* rehype run treats that
   * many characters as already-visible. Also clears the StrictMode rewind
   * mark so the next commit starts clean. Called from Block's useLayoutEffect.
   */
  commit: () => void;
  /** Peak char count written by the last rehype run. Non-destructive. */
  getLastRenderCharCount: () => number;
  name: "animate";
  rehypePlugin: Pluggable;
  /**
   * Manually set how many HAST characters count as already-rendered.
   * Prefer `commit()` in React; this is for tests / custom hosts.
   */
  setPrevContentLength: (length: number) => void;
  type: "animate";
}

export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {});
  duration?: number;
  easing?: string;
  /**
   * Soft cap (ms) on how far ahead of wall-clock words may be scheduled.
   * Larger values favour longer cascades / stricter cross-block serialization;
   * smaller values keep a fast stream visually caught up. @default 320
   */
  maxBacklogMs?: number;
  sep?: "word" | "char";
  stagger?: number;
}

const WHITESPACE_RE = /\s/;
const WHITESPACE_ONLY_RE = /^\s+$/;
const SKIP_TAGS = new Set(["code", "pre", "svg", "math", "annotation"]);

const isElement = (node: unknown): node is Element =>
  typeof node === "object" &&
  node !== null &&
  "type" in node &&
  (node as Element).type === "element";

const hasSkipAncestor = (ancestors: Node[]): boolean =>
  ancestors.some(
    (ancestor) => isElement(ancestor) && SKIP_TAGS.has(ancestor.tagName)
  );

/**
 * Stamp ancestors so Memo* comparators notice "had animate spans" vs
 * "plain text after settle" without a full subtree remount (#570).
 * Walks rootward and stops early once a stamped node is found (its
 * ancestors were stamped when it was).
 */
const markAnimatedAncestors = (ancestors: Node[]): void => {
  for (let i = ancestors.length - 1; i >= 0; i -= 1) {
    const ancestor = ancestors[i];
    if (!isElement(ancestor)) {
      continue;
    }
    if (ancestor.properties?.["data-sd-animated"]) {
      break;
    }
    ancestor.properties = {
      ...ancestor.properties,
      "data-sd-animated": true,
    };
  }
};

/**
 * Split text into animateable units. Trailing whitespace is glued onto the
 * preceding visible token so it lives inside the same `<span>` — otherwise a
 * bare space under an underlined `<a>` paints the underline before the word
 * fades in (#535).
 */
const splitByWord = (text: string): string[] => {
  const parts: string[] = [];
  let current = "";
  let inWhitespace = false;

  for (const char of text) {
    const isWs = WHITESPACE_RE.test(char);
    if (isWs !== inWhitespace && current) {
      if (isWs) {
        current += char;
        inWhitespace = true;
        continue;
      }
      parts.push(current);
      current = "";
    }
    current += char;
    inWhitespace = isWs;
  }

  if (current) {
    parts.push(current);
  }

  return parts;
};

const splitByChar = (text: string): string[] => {
  const parts: string[] = [];
  let wsBuffer = "";

  for (const char of text) {
    if (WHITESPACE_RE.test(char)) {
      if (
        parts.length > 0 &&
        !WHITESPACE_ONLY_RE.test(parts.at(-1) as string)
      ) {
        parts[parts.length - 1] += char;
      } else {
        wsBuffer += char;
      }
    } else {
      if (wsBuffer) {
        parts.push(wsBuffer);
        wsBuffer = "";
      }
      parts.push(char);
    }
  }

  if (wsBuffer) {
    if (parts.length > 0) {
      parts[parts.length - 1] += wsBuffer;
    } else {
      parts.push(wsBuffer);
    }
  }

  return parts;
};

const makeSpan = (
  word: string,
  animation: string,
  duration: number,
  easing: string,
  skipAnimation?: boolean,
  delay?: number
): Element => {
  let style = `--sd-animation:sd-${animation};--sd-duration:${skipAnimation ? 0 : duration}ms;--sd-easing:${easing}`;
  if (delay) {
    style += `;--sd-delay:${Math.round(delay)}ms`;
  }
  return {
    type: "element",
    tagName: "span",
    properties: {
      "data-sd-animate": true,
      style,
    },
    children: [{ type: "text", value: word }],
  };
};

interface AnimateConfig {
  animation: string;
  duration: number;
  easing: string;
  sep: "word" | "char";
  stagger: number;
  timeline?: AnimateTimeline;
}

interface AnimateRenderState {
  committedCharCount: number;
  lastRenderCharCount: number;
  /**
   * Timeline cursor snapshot from the first rehype run of the current commit.
   * null → not yet run this commit; number → rewind here on re-entry
   * (StrictMode double-invoke / discarded concurrent render).
   */
  pendingMark: number | null;
  prevContentLength: number;
}

interface Schedule {
  baseDelay: number;
  step: number;
}

/** Count newly-animated words (mirrors processTextNode skip logic). */
const countNewWords = (
  tree: Root,
  config: AnimateConfig,
  prevLen: number
): number => {
  let newWords = 0;
  let charPos = 0;
  visitParents(tree, "text", (node: Text, ancestors) => {
    if (hasSkipAncestor(ancestors)) {
      return SKIP;
    }
    const text = node.value;
    if (!text.trim()) {
      charPos += text.length;
      return;
    }
    const parts = config.sep === "char" ? splitByChar(text) : splitByWord(text);
    for (const part of parts) {
      const partStart = charPos;
      charPos += part.length;
      if (WHITESPACE_ONLY_RE.test(part)) {
        continue;
      }
      if (!(prevLen > 0 && partStart < prevLen)) {
        newWords += 1;
      }
    }
  });
  return newWords;
};

const processTextNode = (
  node: Text,
  ancestors: Node[],
  config: AnimateConfig,
  renderState: AnimateRenderState,
  charCounter: { count: number; newIndex: number },
  schedule: Schedule
): number | typeof SKIP | undefined => {
  const ancestor = ancestors.at(-1);
  /* v8 ignore next */
  if (!(ancestor && "children" in ancestor)) {
    return;
  }

  if (hasSkipAncestor(ancestors)) {
    return SKIP;
  }

  const parent = ancestor as Parent;
  const index = parent.children.indexOf(node);
  /* v8 ignore next */
  if (index === -1) {
    return;
  }

  const text = node.value;
  if (!text.trim()) {
    charCounter.count += text.length;
    return;
  }

  const parts = config.sep === "char" ? splitByChar(text) : splitByWord(text);
  const prevLen = renderState.prevContentLength;
  let didAnimate = false;

  const nodes: (Element | Text)[] = parts.map((part) => {
    const partStart = charCounter.count;
    charCounter.count += part.length;
    if (WHITESPACE_ONLY_RE.test(part)) {
      return { type: "text", value: part } as Text;
    }
    const skipAnimation = prevLen > 0 && partStart < prevLen;
    const delay = skipAnimation
      ? 0
      : schedule.baseDelay + charCounter.newIndex++ * schedule.step;
    didAnimate = true;
    return makeSpan(
      part,
      config.animation,
      config.duration,
      config.easing,
      skipAnimation,
      delay
    );
  });

  if (didAnimate) {
    markAnimatedAncestors(ancestors);
  }

  parent.children.splice(index, 1, ...nodes);
  return index + nodes.length;
};

let instanceId = 0;

/**
 * Create an animate rehype plugin. The optional `timeline` is an internal
 * Streamdown wiring detail — not part of the public `animated` prop surface.
 */
export function createAnimatePlugin(
  options?: AnimateOptions & { timeline?: AnimateTimeline }
): AnimatePlugin {
  const config: AnimateConfig = {
    animation: options?.animation ?? "fadeIn",
    duration: options?.duration ?? 150,
    easing: options?.easing ?? "ease",
    sep: options?.sep ?? "word",
    stagger: options?.stagger ?? 40,
    timeline: options?.timeline,
  };

  const renderState: AnimateRenderState = {
    committedCharCount: 0,
    prevContentLength: 0,
    lastRenderCharCount: 0,
    pendingMark: null,
  };

  const id = instanceId++;
  const rehypeAnimate = () => (tree: Root) => {
    const charCounter = { count: 0, newIndex: 0 };

    // Seed skip-window from the last committed paint (#570 secondary).
    renderState.prevContentLength = renderState.committedCharCount;

    const timeline = config.timeline;
    const now = timeline?.now() ?? defaultNow();

    // StrictMode / discarded render: first run marks the cursor; a re-run
    // rewinds so take() doesn't stack on itself. commit() clears the mark.
    if (timeline) {
      if (renderState.pendingMark === null) {
        renderState.pendingMark = timeline.mark();
      } else {
        timeline.rewind(renderState.pendingMark);
      }
    }

    const schedule: Schedule = timeline
      ? timeline.take(
          countNewWords(tree, config, renderState.prevContentLength),
          config.stagger,
          now
        )
      : { baseDelay: 0, step: config.stagger };

    visitParents(tree, "text", (node: Text, ancestors) =>
      processTextNode(
        node,
        ancestors,
        config,
        renderState,
        charCounter,
        schedule
      )
    );
    renderState.lastRenderCharCount = charCounter.count;
    renderState.prevContentLength = 0;
  };

  Object.defineProperty(rehypeAnimate, "name", {
    value: `rehypeAnimate$${id}`,
  });

  return {
    name: "animate",
    type: "animate",
    rehypePlugin: rehypeAnimate,
    setPrevContentLength(length: number) {
      renderState.committedCharCount = length;
      renderState.prevContentLength = length;
    },
    getLastRenderCharCount() {
      return renderState.lastRenderCharCount;
    },
    commit() {
      renderState.committedCharCount = renderState.lastRenderCharCount;
      renderState.pendingMark = null;
    },
  };
}

export const animate = createAnimatePlugin();
