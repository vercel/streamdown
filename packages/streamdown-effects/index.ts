/**
 * Matches `AnimationEffect` in streamdown. Declared here so this package has
 * no runtime or type dependency on it.
 */
export interface AnimationEffect {
  decorate?: (text: string, seed: number) => Record<`data-${string}`, string>;
  duration?: number;
  name: string;
  scatter?: number;
}

const UPPERCASE_RE = /\p{Lu}/u;
const LETTER_RE = /\p{L}/u;
const NUMBER_RE = /\p{N}/u;

const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = LOWER.toUpperCase();
const DIGITS = "0123456789";

const hash01 = (a: number, b: number): number => {
  const x = Math.sin(a * 12.9898 + b * 78.233) * 43_758.5453;
  return x - Math.floor(x);
};

const pick = (set: string, seed: number, index: number): string =>
  set.charAt(Math.floor(hash01(seed, index) * set.length));

/**
 * Same-shape noise for a word: letters and digits become random characters
 * of the same class; punctuation and spacing are kept. Deterministic for a
 * given seed.
 */
export const noise = (text: string, seed: number): string => {
  let out = "";
  let index = 0;
  for (const char of text) {
    if (UPPERCASE_RE.test(char)) {
      out += pick(UPPER, seed, index);
    } else if (LETTER_RE.test(char)) {
      out += pick(LOWER, seed, index);
    } else if (NUMBER_RE.test(char)) {
      out += pick(DIGITS, seed, index);
    } else {
      out += char;
    }
    index += 1;
  }
  return out;
};

/** Words sharpen out of a blur, in scattered order. */
export const diffuse: AnimationEffect = {
  duration: 420,
  name: "diffuse",
  scatter: 140,
};

/**
 * Words start as noise glyphs that change once, then resolve to the real
 * text, in scattered order. The real text stays in the DOM throughout.
 */
export const scramble: AnimationEffect = {
  decorate: (text, seed) => ({
    "data-sd-glyphs": noise(text, seed),
    "data-sd-glyphs-alt": noise(text, seed + 1),
  }),
  duration: 320,
  name: "scramble",
  scatter: 160,
};
