import { describe, expect, it } from "vitest";
import { createTextPacer, snapToWord } from "../lib/use-smooth-stream";

const WHITESPACE_RE = /\s/;

describe("snapToWord", () => {
  it("extends to the end of the word the head is in", () => {
    expect(snapToWord("hello world", 2, true)).toBe(5);
  });

  it("holds back a trailing partial word while streaming", () => {
    expect(snapToWord("hello wor", 9, false)).toBe(6);
  });

  it("shows the trailing word once the stream is final", () => {
    expect(snapToWord("hello wor", 9, true)).toBe(9);
  });

  it("treats each CJK character as its own unit", () => {
    expect(snapToWord("你好世界", 2, false)).toBe(2);
    expect(snapToWord("你好世界", 4, false)).toBe(4);
  });

  it("caps runs with no boundary", () => {
    expect(snapToWord("a".repeat(100), 0, true)).toBe(32);
    expect(snapToWord("a".repeat(100), 100, false)).toBe(68);
  });

  it("does not split a surrogate pair at a cap", () => {
    const text = `${"a".repeat(31)}😀${"a".repeat(20)}`;
    expect(snapToWord(text, 0, true)).toBe(31);
  });
});

describe("createTextPacer", () => {
  it("treats the initial text as already shown", () => {
    const pacer = createTextPacer("already here");
    expect(pacer.visible).toBe("already here");
    expect(pacer.isRevealing).toBe(false);
  });

  it("reveals an append gradually over the measured gap", () => {
    const pacer = createTextPacer("");
    const first = "one two ";
    const second = `${first}three four five six seven eight nine ten `;

    pacer.update(first, true, 0);
    pacer.advance(200);
    expect(pacer.visible).toBe(first);

    pacer.update(second, true, 500);
    expect(pacer.visible).toBe(first);
    expect(pacer.isRevealing).toBe(true);

    pacer.advance(750);
    expect(pacer.visible.length).toBeGreaterThan(first.length);
    expect(pacer.visible.length).toBeLessThan(second.length);
    expect(second.startsWith(pacer.visible)).toBe(true);
    expect(second.charAt(pacer.visible.length)).toMatch(WHITESPACE_RE);

    pacer.advance(1000);
    expect(pacer.visible).toBe(second);
    expect(pacer.isRevealing).toBe(false);
  });

  it("never shows a partial trailing word while streaming", () => {
    const pacer = createTextPacer("");
    pacer.update("playing gu", true, 0);
    pacer.advance(10_000);
    expect(pacer.visible).toBe("playing ");
    expect(pacer.isRevealing).toBe(false);

    pacer.update("playing guitar ", true, 10_500);
    pacer.advance(20_000);
    expect(pacer.visible).toBe("playing guitar ");
  });

  it("shows everything shortly after the stream ends", () => {
    const pacer = createTextPacer("");
    pacer.update("a b ", true, 0);
    const text = `a b ${"word ".repeat(60)}tail`;
    pacer.update(text, true, 500);
    pacer.advance(520);
    expect(pacer.visible.length).toBeLessThan(text.length);

    pacer.update(text, false, 520);
    pacer.advance(520 + 250);
    expect(pacer.visible).toBe(text);
    expect(pacer.isRevealing).toBe(false);
  });

  it("shows a change that is not an append immediately", () => {
    const pacer = createTextPacer("");
    pacer.update("first draft of the text ", true, 0);
    pacer.update("a replacement frame", true, 100);
    expect(pacer.visible).toBe("a replacement frame");
    expect(pacer.isRevealing).toBe(false);
  });

  it("shows a same-length replacement immediately", () => {
    const pacer = createTextPacer("abc");
    pacer.update("xyz", true, 0);
    expect(pacer.visible).toBe("xyz");
  });

  it("flush shows everything", () => {
    const pacer = createTextPacer("");
    pacer.update("x ", true, 0);
    pacer.update(`x ${"long chunk ".repeat(20)}`, true, 500);
    pacer.flush();
    expect(pacer.visible).toBe(`x ${"long chunk ".repeat(20)}`);
  });

  it("keeps up with a steady cadence instead of building a backlog", () => {
    const pacer = createTextPacer("");
    const chunk = "alpha beta gamma delta epsilon zeta eta theta iota kappa ";
    let text = "";
    for (let i = 0; i < 20; i += 1) {
      const at = i * 500;
      text += chunk;
      pacer.update(text, true, at);
      // Just before the next chunk, at most the tail of this one is left.
      pacer.advance(at + 499);
      if (i >= 3) {
        expect(text.length - pacer.visible.length).toBeLessThan(
          chunk.length / 2
        );
      }
      // Whole words only: fully shown, or cut right before whitespace.
      const next = text.charAt(pacer.visible.length);
      expect(next === "" || WHITESPACE_RE.test(next)).toBe(true);
    }
  });
});
