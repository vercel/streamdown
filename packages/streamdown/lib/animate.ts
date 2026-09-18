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
  passNow: () => number;
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
  let passStartedAt = nowFn();

  return {
    now: nowFn,
    passNow: () => passStartedAt,
    beginPass(now: number) {
      passStartedAt = now;
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
   * many characters as already-scheduled. Also clears the StrictMode rewind
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

/**
 * An animation packaged with the per-word behavior its keyframes need, such
 * as the ones in `@streamdown/effects`. Pass it as `animated.animation`.
 */
export interface AnimationEffect {
  /**
   * Extra attributes for each word while it animates, such as text for
   * styles to draw. Must return the same attributes for the same arguments:
   * words are re-rendered while they animate.
   */
  decorate?: (text: string, seed: number) => Record<`data-${string}`, string>;
  /** Default duration in ms. `animated.duration` overrides it. */
  duration?: number;
  /** `@keyframes` name without the `sd-` prefix. */
  name: string;
  /**
   * Maximum extra delay in ms per word, hashed from its position, so words
   * resolve in scattered order instead of left to right.
   */
  scatter?: number;
}

export interface AnimateOptions {
  animation?: "fadeIn" | "blurIn" | "slideUp" | (string & {}) | AnimationEffect;
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
// Skip layout-sensitive subtrees. Fenced/highlighted blocks are protected via
// `pre` (CommonMark always emits `pre > code`); raw inline `code` is safe to
// animate — word spans inherit styles the same way surrounding prose does (#594).
const SKIP_TAGS = new Set(["pre", "svg", "math", "annotation"]);
// Code fences reserve one slot without touching syntax-highlighting spans.
// Like images and rules, the whole element follows the shared timeline.
const ATOMIC_ANIMATE_TAGS = new Set(["img", "hr", "pre"]);

const isElement = (node: unknown): node is Element =>
  typeof node === "object" &&
  node !== null &&
  "type" in node &&
  (node as Element).type === "element";

const hasSkipAncestor = (ancestors: Node[]): boolean =>
  ancestors.some(
    (ancestor) => isElement(ancestor) && SKIP_TAGS.has(ancestor.tagName)
  );

const findLiAncestor = (ancestors: Node[]): Element | undefined => {
  for (let i = ancestors.length - 1; i >= 0; i--) {
    const ancestor = ancestors[i];
    if (isElement(ancestor) && ancestor.tagName === "li") {
      return ancestor;
    }
  }
  return undefined;
};

// The ::marker glyph can't be wrapped in an animated span, so we stamp
// timing onto the <li> and let a CSS rule fade the marker's color in.
// Timing mirrors the item's first animated word so they appear together.
const stampMarker = (
  li: Element,
  duration: number,
  delay: number,
  easing: string
): void => {
  li.properties ??= {};
  li.properties["data-sd-animate-marker"] = true;
  const existing =
    typeof li.properties.style === "string" ? `${li.properties.style};` : "";
  li.properties.style =
    `${existing}--sd-marker-duration:${duration}ms;` +
    `--sd-marker-delay:${Math.round(delay)}ms;--sd-marker-easing:${easing}`;
};

// A task-list checkbox is a direct child of its <li> (or nested in a <p> for
// loose lists). Recurse to reach it, but never cross into a nested list, or we
// could grab a sub-item's checkbox and stamp it with the wrong timing.
const LIST_CONTAINER_TAGS = new Set(["ul", "ol", "li"]);
const findCheckbox = (element: Element): Element | undefined => {
  for (const child of element.children) {
    if (isElement(child)) {
      if (child.tagName === "input") {
        return child;
      }
      if (LIST_CONTAINER_TAGS.has(child.tagName)) {
        continue;
      }
      const nested = findCheckbox(child);
      if (nested) {
        return nested;
      }
    }
  }
  return undefined;
};

// Tag a non-text element so the standard [data-sd-animate] rule animates it,
// using the same timing/config the text spans use. Any existing inline style
// is preserved.
const stampAnimation = (
  element: Element,
  config: AnimateConfig,
  duration: number,
  delay: number
): void => {
  element.properties ??= {};
  element.properties["data-sd-animate"] = true;
  const existing =
    typeof element.properties.style === "string"
      ? `${element.properties.style};`
      : "";
  element.properties.style =
    `${existing}--sd-animation:sd-${config.animation};` +
    `--sd-duration:${duration}ms;--sd-easing:${config.easing};` +
    `--sd-delay:${Math.round(delay)}ms`;
};

// Task-list checkboxes are <input> elements, not text nodes, so the plugin
// never wraps them. Unlike ::marker, an <input> honors opacity/transform, so
// we reuse the same timing as the item's first word.
const stampCheckbox = (
  li: Element,
  config: AnimateConfig,
  duration: number,
  delay: number
): void => {
  const input = findCheckbox(li);
  if (input) {
    stampAnimation(input, config, duration, delay);
  }
};

// Atomic elements occupy one position regardless of their contents, so growing
// a code fence cannot restart its fade or move the following text's offset.
const processAtomicElement = (
  element: Element,
  ancestors: Node[],
  config: AnimateConfig,
  renderState: AnimateRenderState,
  charCounter: { count: number; newIndex: number },
  schedule: Schedule
): void => {
  if (hasSkipAncestor(ancestors)) {
    return;
  }
  const partStart = charCounter.count;
  charCounter.count += 1;
  const timing = animationTiming(
    partStart,
    config,
    renderState,
    charCounter,
    schedule
  );
  stampAnimation(element, config, timing.duration, timing.delay);
};

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
  delay?: number,
  attributes?: Record<string, string>
): Element => {
  let style = `--sd-animation:sd-${animation};--sd-duration:${duration}ms;--sd-easing:${easing}`;
  if (delay) {
    style += `;--sd-delay:${Math.round(delay)}ms`;
  }
  const properties: Element["properties"] = {
    "data-sd-animate": true,
    style,
  };
  for (const [key, value] of Object.entries(attributes ?? {})) {
    // Effects run after sanitization, so only data attributes pass through.
    if (key.startsWith("data-")) {
      properties[key] = value;
    }
  }
  return {
    type: "element",
    tagName: "span",
    properties,
    children: [{ type: "text", value: word }],
  };
};

interface AnimateConfig {
  animation: string;
  decorate?: AnimationEffect["decorate"];
  duration: number;
  easing: string;
  scatter: number;
  /** Per-block salt for position hashes. */
  seed: number;
  sep: "word" | "char";
  stagger: number;
  timeline?: AnimateTimeline;
}

interface AnimationTiming {
  delay: number;
  endsAt: number;
}

interface AnimateRenderState {
  committedAnimations: Map<number, AnimationTiming>;
  committedCharCount: number;
  lastRenderCharCount: number;
  now: number;
  pendingAnimations: Map<number, AnimationTiming>;
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

/** Deterministic [0, 1) hash, so StrictMode re-runs and re-renders agree. */
const hash01 = (a: number, b: number): number => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43_758.5453;
  return x - Math.floor(x);
};

const isNewAnimateUnit = (prevLen: number, partStart: number): boolean =>
  !(prevLen > 0 && partStart < prevLen);

const animationTiming = (
  partStart: number,
  config: AnimateConfig,
  state: AnimateRenderState,
  counter: { newIndex: number },
  schedule: Schedule
): { duration: number; delay: number } => {
  let timing = state.committedAnimations.get(partStart);
  if (isNewAnimateUnit(state.prevContentLength, partStart)) {
    const scatter =
      config.scatter > 0 ? config.scatter * hash01(config.seed, partStart) : 0;
    const delay = Math.round(
      schedule.baseDelay + counter.newIndex++ * schedule.step + scatter
    );
    timing = { delay, endsAt: state.now + delay + config.duration };
  }
  if (!timing || timing.endsAt <= state.now) {
    return { duration: 0, delay: 0 };
  }
  // Keep the original CSS timing on retained DOM nodes. Replacing it with
  // duration:0 before the fade ends jumps to its final keyframe; subtracting
  // elapsed time from the delay would advance an already-running animation.
  state.pendingAnimations.set(partStart, timing);
  return { duration: config.duration, delay: timing.delay };
};

// remark-rehype pads block elements with positionless newlines. They are not
// streamed content: trailing padding must not make the next word look old, and
// adding <p> wrappers to a loose list must not shift existing animation offsets.
const isLayoutWhitespace = (node: Text): boolean =>
  !node.position && WHITESPACE_ONLY_RE.test(node.value);

const isAtomicAnimateElement = (node: Node): node is Element =>
  isElement(node) && ATOMIC_ANIMATE_TAGS.has(node.tagName);

/**
 * Count newly-animated units (mirrors processTextNode / processAtomicElement
 * skip logic) so timeline.take reserves the right number of slots.
 */
const countNewWords = (
  tree: Root,
  config: AnimateConfig,
  prevLen: number
): number => {
  let newWords = 0;
  let charPos = 0;
  visitParents(
    tree,
    (node: Node) => node.type === "text" || isAtomicAnimateElement(node),
    (node: Node, ancestors) => {
      if (hasSkipAncestor(ancestors)) {
        return SKIP;
      }
      if (isAtomicAnimateElement(node)) {
        if (isNewAnimateUnit(prevLen, charPos)) {
          newWords += 1;
        }
        charPos += 1;
        return;
      }
      if (isLayoutWhitespace(node as Text)) {
        return;
      }
      const text = (node as Text).value;
      if (!text.trim()) {
        charPos += text.length;
        return;
      }
      const parts =
        config.sep === "char" ? splitByChar(text) : splitByWord(text);
      for (const part of parts) {
        const partStart = charPos;
        charPos += part.length;
        if (
          !WHITESPACE_ONLY_RE.test(part) &&
          isNewAnimateUnit(prevLen, partStart)
        ) {
          newWords += 1;
        }
      }
    }
  );
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

  if (isLayoutWhitespace(node)) {
    return;
  }
  const text = node.value;
  if (!text.trim()) {
    charCounter.count += text.length;
    return;
  }

  const parts = config.sep === "char" ? splitByChar(text) : splitByWord(text);
  let didAnimate = false;

  // Fade the list marker in with this item's first animated word. Only the
  // first word of the nearest <li> stamps it; later words leave it untouched.
  const liAncestor = findLiAncestor(ancestors);
  const needsMarker = Boolean(
    liAncestor && !liAncestor.properties?.["data-sd-animate-marker"]
  );
  let markerStamped = false;

  const nodes: (Element | Text)[] = parts.map((part) => {
    const partStart = charCounter.count;
    charCounter.count += part.length;
    if (WHITESPACE_ONLY_RE.test(part)) {
      return { type: "text", value: part } as Text;
    }
    const timing = animationTiming(
      partStart,
      config,
      renderState,
      charCounter,
      schedule
    );
    didAnimate = true;
    if (liAncestor && needsMarker && !markerStamped) {
      stampMarker(liAncestor, timing.duration, timing.delay, config.easing);
      stampCheckbox(liAncestor, config, timing.duration, timing.delay);
      markerStamped = true;
    }
    return makeSpan(
      part,
      config.animation,
      timing.duration,
      config.easing,
      timing.delay,
      config.decorate && timing.duration > 0
        ? config.decorate(part.trimEnd(), config.seed * 100_003 + partStart)
        : undefined
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
  const id = instanceId++;
  const animation = options?.animation ?? "fadeIn";
  const effect = typeof animation === "string" ? undefined : animation;
  const config: AnimateConfig = {
    animation: typeof animation === "string" ? animation : animation.name,
    decorate: effect?.decorate,
    duration: options?.duration ?? effect?.duration ?? 150,
    easing: options?.easing ?? "ease",
    scatter: effect?.scatter ?? 0,
    seed: id,
    sep: options?.sep ?? "word",
    stagger: options?.stagger ?? 40,
    timeline: options?.timeline,
  };

  const renderState: AnimateRenderState = {
    committedAnimations: new Map(),
    committedCharCount: 0,
    prevContentLength: 0,
    lastRenderCharCount: 0,
    pendingMark: null,
    now: 0,
    pendingAnimations: new Map(),
  };

  const rehypeAnimate = () => (tree: Root) => {
    const charCounter = { count: 0, newIndex: 0 };

    // Seed the scheduled prefix from the last committed paint (#570 secondary).
    renderState.prevContentLength = renderState.committedCharCount;
    renderState.pendingAnimations = new Map();

    const timeline = config.timeline;
    // All blocks paint in the same commit, so their CSS delays share an origin.
    const now = timeline?.passNow() ?? defaultNow();
    renderState.now = now;

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

    visitParents(
      tree,
      (node: Node) => node.type === "text" || isAtomicAnimateElement(node),
      (node: Node, ancestors) => {
        if (node.type === "text") {
          return processTextNode(
            node as Text,
            ancestors,
            config,
            renderState,
            charCounter,
            schedule
          );
        }
        processAtomicElement(
          node as Element,
          ancestors,
          config,
          renderState,
          charCounter,
          schedule
        );
      }
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
      renderState.committedAnimations.clear();
    },
    getLastRenderCharCount() {
      return renderState.lastRenderCharCount;
    },
    commit() {
      renderState.committedCharCount = renderState.lastRenderCharCount;
      renderState.committedAnimations = renderState.pendingAnimations;
      renderState.pendingMark = null;
    },
  };
}

export const animate = createAnimatePlugin();
