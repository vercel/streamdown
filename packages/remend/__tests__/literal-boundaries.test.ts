import { describe, expect, it } from "vitest";
import remend from "../src/index";

const protect = (payload: string) => (source: string) => {
  const start = source.indexOf(payload);
  return start < 0 ? [] : [{ start, end: start + payload.length }];
};

describe("opaque edit boundaries", () => {
  it.each([
    "-",
    "--",
    "=",
    "==",
  ])("does not repair a protected setext line %s", (marker) => {
    const source = `opaque\n${marker}`;
    expect(remend(source, { literalRanges: protect(source) })).toBe(source);
  });
  it("does not trim protected whitespace before an incomplete HTML tag", () => {
    const payload = "opaque \n ";
    expect(remend(`${payload}<tag`, { literalRanges: protect(payload) })).toBe(
      payload
    );
  });
  it.each([
    "protocol",
    "text-only",
  ] as const)("keeps opaque payload and following prose after an incomplete URL in %s mode", (linkMode) => {
    const payload = "opaque payload";
    const source = `[label](url ${payload} tail`;
    const prefix =
      linkMode === "protocol" ? "[label](streamdown:incomplete-link)" : "label";
    expect(remend(source, { literalRanges: protect(payload), linkMode })).toBe(
      `${prefix}${payload} tail`
    );
  });
  it("inserts an underscore outside protected trailing newlines", () => {
    const payload = "opaque\n\n";
    const source = `_before ${payload}`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(
      `${source}_`
    );
  });
  it.each([
    "protocol",
    "text-only",
  ] as const)("keeps an opaque tail after an incomplete image URL in %s mode", (linkMode) => {
    const payload = "opaque payload";
    expect(
      remend(`![alt](url ${payload} tail`, {
        literalRanges: protect(payload),
        linkMode,
      })
    ).toBe(`![alt](streamdown:incomplete-image)${payload} tail`);
  });
  it("does not let an HTML opener before a literal swallow it", () => {
    const payload = "opaque";
    const source = `<tag ${payload} tail`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(source);
  });
  it("can still remove a later incomplete tag after an opaque region", () => {
    const payload = "opaque ";
    expect(
      remend(`<tag ${payload}<other`, { literalRanges: protect(payload) })
    ).toBe(`<tag ${payload}`);
  });
  it("does not move an underscore into a literal trailing asterisk pair", () => {
    const payload = "opaque**";
    const source = `**before _${payload}`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(
      `${source}_**`
    );
  });
  it("does not escape a protected comparison after an unprotected list prefix", () => {
    const payload = "> 25";
    const source = `- ${payload}`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(source);
  });
  it.each([
    "\n",
    "\n\n",
  ])("places underscore completion before only unprotected trailing newlines %j", (ending) => {
    const payload = "opaque\n";
    const source = `_before ${payload}${ending}`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(
      `_before ${payload}_${ending}`
    );
  });
  it.each([
    ["**before ", "opaque*", "**"],
    ["$$before ", "opaque$", "$$"],
  ])("does not count a literal partial closing marker for %s", (prefix, payload, closing) => {
    const source = `${prefix}${payload}`;
    expect(remend(source, { literalRanges: protect(payload) })).toBe(
      `${source}${closing}`
    );
  });
});
