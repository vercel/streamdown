import { useEffect, useRef, useState } from "react";

/** Reveal horizon before a second chunk gives us a real gap to measure. */
const FIRST_GAP_MS = 120;
/** Clamp for the gap estimate, so a long stall doesn't make the next reveal crawl. */
const MIN_GAP_MS = 16;
const MAX_GAP_MS = 1000;
/**
 * Gap estimate smoothing. It rises fast when chunks slow down and decays
 * slowly when they speed up, so one quick chunk can't drain the buffer early
 * before the next slow gap.
 */
const GAP_RISE = 0.5;
const GAP_DECAY = 0.15;
/** Once the stream ends, show whatever is still held back within this time. */
const DRAIN_MS = 250;
/** Longest run revealed or held back as one "word" when no boundary is found. */
const MAX_WORD_CHARS = 32;

// Whitespace ends a word. Han, kana and Hangul characters are each their own
// unit, so CJK text still reveals smoothly without spaces.
const BOUNDARY_RE =
  /[\s\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

const isBoundary = (char: string): boolean => BOUNDARY_RE.test(char);

const isHighSurrogate = (code: number): boolean =>
  code >= 0xd8_00 && code <= 0xdb_ff;

/**
 * Visible length for a reveal head at `head`. Extends forward to the end of
 * the word the head is in, so words appear whole. While streaming, holds
 * back a trailing word the producer may still be extending.
 */
export const snapToWord = (
  text: string,
  head: number,
  final: boolean
): number => {
  let end = Math.min(Math.floor(head), text.length);
  const limit = Math.min(text.length, end + MAX_WORD_CHARS);
  while (end < limit && !isBoundary(text.charAt(end))) {
    end += 1;
  }
  if (!final && end === text.length) {
    const floor = Math.max(0, end - MAX_WORD_CHARS);
    while (end > floor && !isBoundary(text.charAt(end - 1))) {
      end -= 1;
    }
  }
  // Never split a surrogate pair at a MAX_WORD_CHARS cut.
  if (
    end > 0 &&
    end < text.length &&
    isHighSurrogate(text.charCodeAt(end - 1))
  ) {
    end -= 1;
  }
  return end;
};

export interface TextPacer {
  /** Move the reveal head forward to `now`. */
  advance: (now: number) => void;
  /** Show everything immediately. */
  flush: () => void;
  /** True while there is text the pacer can still reveal. */
  readonly isRevealing: boolean;
  /**
   * Feed the latest full text. Appends are paced; any other change (reset,
   * edit, a diffusion model's full-text frame) is shown immediately.
   */
  update: (text: string, streaming: boolean, now: number) => void;
  readonly visible: string;
}

/**
 * Jitter buffer for bursty streams. Each arrival re-targets the reveal rate
 * so the current backlog finishes around when the next chunk is expected.
 * `initial` is treated as already shown.
 */
export const createTextPacer = (initial: string): TextPacer => {
  let target = initial;
  /** Fractional reveal position. */
  let head = initial.length;
  /** Visible length, snapped to words. Never decreases for a given target. */
  let end = initial.length;
  /** Characters per millisecond. */
  let rate = 0;
  /** Estimated milliseconds between arrivals; 0 until measured. */
  let gap = 0;
  let lastArrival: number | null = null;
  let lastAdvance: number | null = null;
  let streaming = false;
  /** `target.slice(0, end)`, cached so frames that reveal nothing don't copy. */
  let visible = initial;

  const growTo = (next: number) => {
    if (next > end) {
      end = next;
      visible = target.slice(0, end);
    }
  };

  const advance = (now: number) => {
    const elapsed = lastAdvance === null ? 0 : Math.max(0, now - lastAdvance);
    lastAdvance = now;
    head = Math.min(target.length, head + rate * elapsed);
    growTo(snapToWord(target, head, !streaming));
  };

  const recordArrival = (now: number) => {
    if (lastArrival !== null) {
      const observed = Math.min(
        MAX_GAP_MS,
        Math.max(MIN_GAP_MS, now - lastArrival)
      );
      const weight = observed > gap ? GAP_RISE : GAP_DECAY;
      gap = gap === 0 ? observed : gap + weight * (observed - gap);
    }
    lastArrival = now;
  };

  return {
    advance,
    flush() {
      head = target.length;
      rate = 0;
      growTo(target.length);
    },
    get isRevealing() {
      return end < snapToWord(target, target.length, !streaming);
    },
    update(text, isStreaming, now) {
      // Settle progress made under the previous rate first.
      advance(now);
      streaming = isStreaming;

      if (text !== target) {
        if (text.startsWith(target)) {
          recordArrival(now);
          target = text;
        } else {
          target = text;
          head = text.length;
          end = text.length;
          visible = text;
          gap = 0;
          lastArrival = null;
        }
      }

      const backlog = target.length - head;
      rate = backlog / (gap || FIRST_GAP_MS);
      if (!streaming) {
        rate = Math.max(rate, backlog / DRAIN_MS);
      }
    },
    get visible() {
      return visible;
    },
  };
};

const now = (): number =>
  typeof performance === "undefined" ? Date.now() : performance.now();

const isDocumentHidden = (): boolean =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

export interface SmoothStreamOptions {
  children: unknown;
  /** Whether more text may still arrive. */
  isAnimating: boolean;
  mode: "static" | "streaming";
  smooth: boolean;
}

export interface SmoothStream {
  isAnimating: boolean;
  mode: "static" | "streaming";
  text: string;
}

/**
 * Paces string `children` for display when `smooth` is on. Appends are
 * revealed over time; any other change renders as-is. While held-back text
 * is still being shown, reports streaming state even if the stream has
 * ended, so caret, animation and `onAnimationEnd` wait for it.
 */
export const useSmoothStream = ({
  children,
  isAnimating,
  mode,
  smooth,
}: SmoothStreamOptions): SmoothStream => {
  const text = typeof children === "string" ? children : "";
  const pacerRef = useRef<TextPacer | null>(null);
  const [visible, setVisible] = useState(text);
  const [wasSmooth, setWasSmooth] = useState(smooth);

  // Turning pacing on mid-stream starts from the full current text, not from
  // whatever was last paced.
  if (smooth !== wasSmooth) {
    setWasSmooth(smooth);
    setVisible(text);
  }

  // Constant while disabled, so the effect doesn't re-run on every token.
  const source = smooth ? text : "";
  const streaming = smooth && isAnimating;

  useEffect(() => {
    if (!smooth) {
      pacerRef.current = null;
      return;
    }
    pacerRef.current ??= createTextPacer(source);
    const pacer = pacerRef.current;
    pacer.update(source, streaming, now());
    // Animation frames don't run in hidden tabs. Arrivals and the end of the
    // stream still land here, so show everything instead of stalling. If the
    // tab hides between arrivals, the first frame back catches up at once.
    if (isDocumentHidden()) {
      pacer.flush();
    }

    let frame = 0;
    const tick = () => {
      pacer.advance(now());
      setVisible(pacer.visible);
      if (pacer.isRevealing) {
        frame = requestAnimationFrame(tick);
      }
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [source, streaming, smooth]);

  // Until the effect catches up, a non-append change renders as-is rather
  // than flashing the previous text.
  const shown = smooth && text.startsWith(visible) ? visible : text;
  const isCatchingUp = shown.length < text.length;
  return {
    isAnimating: isAnimating || isCatchingUp,
    mode: isCatchingUp ? "streaming" : mode,
    text: shown,
  };
};
