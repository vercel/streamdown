import { describe, expect, test } from "vitest";
import remend from "../src/index";
const all = (source: string) => [{ start: 0, end: source.length }];
const value = "20~25";

describe("Independent opaque-range dynamic scope acceptance", () => {
  test("unprotected nested invocation does not inherit outer opaque ranges or poison outer cache", () => {
    let nested: string | undefined;
    const output = remend(value, {
      literalRanges: all,
      handlers: [
        {
          name: "independent-nested-unprotected",
          priority: -10,
          handle: (source) => {
            nested = remend(value);
            return source;
          },
        },
      ],
    });
    expect(nested).toBe("20\\~25");
    expect(output).toBe(value);
    expect(remend(value)).toBe("20\\~25");
  });
  test("protected nested invocation does not leak ranges into unprotected outer repair", () => {
    let nested: string | undefined;
    const output = remend(value, {
      handlers: [
        {
          name: "independent-nested-protected",
          priority: -10,
          handle: (source) => {
            nested = remend(value, { literalRanges: all });
            return source;
          },
        },
      ],
    });
    expect(nested).toBe(value);
    expect(output).toBe("20\\~25");
  });
  test("nested call from range callback restores same-string scanner context", () => {
    let nested: string | undefined;
    const output = remend(value, {
      literalRanges: (source) => {
        nested = remend(value);
        return all(source);
      },
    });
    expect(nested).toBe("20\\~25");
    expect(output).toBe(value);
  });
  test("throwing user handler clears opaque scope and cached scan for subsequent calls", () => {
    expect(() =>
      remend(value, {
        literalRanges: all,
        handlers: [
          {
            name: "independent-throwing-handler",
            priority: 100,
            handle: () => {
              throw Error("expected scoped failure");
            },
          },
        ],
      })
    ).toThrow("expected scoped failure");
    expect(remend(value)).toBe("20\\~25");
  });
  test("throwing range callback clears scope even when scan occurs before handler try/finally", () => {
    expect(() =>
      remend(value + " ", {
        literalRanges: () => {
          throw Error("expected range failure");
        },
      })
    ).toThrow("expected range failure");
    expect(remend(value)).toBe("20\\~25");
  });
  test("caught inner callback failure restores outer protected scope", () => {
    const output = remend(value, {
      literalRanges: all,
      handlers: [
        {
          name: "independent-nested-caught-failure",
          priority: -10,
          handle: (source) => {
            expect(() =>
              remend(value + " ", {
                literalRanges: () => {
                  throw Error("expected inner failure");
                },
              })
            ).toThrow("expected inner failure");
            return source;
          },
        },
      ],
    });
    expect(output).toBe(value);
    expect(remend(value)).toBe("20\\~25");
  });
});
