import { describe, expect, it } from "vitest";
import remend from "../src";

describe("intraword asterisk emphasis", () => {
  it.each([
    "*foo*bar",
    "this is *real*ly good",
    "이것은 *기울임*으로 표시",
    "5*6*78",
    // Trailing * after a closed run stays literal
    "*foo*bar*", // preserve trailing * - same behavior as before
    "a *b*c*", // preserve trailing * - same behavior as before
    "a *b*c* d", // preserve trailing * - same behavior as before
    "*b*c*", // preserve trailing * - same behavior as before
    "*a* b*",
    "a *b* c*",
    "*a*b*c*d",
    "x *y*z w",
    "before *a*b after *c*",
  ])("keeps complete emphasis unchanged: %s", (text) => {
    expect(remend(text)).toBe(text);
  });

  it("leaves a lone intraword asterisk literal", () => {
    expect(remend("foo*bar")).toBe("foo*bar");
    expect(remend("hello*world")).toBe("hello*world");
    expect(remend("test*123*test")).toBe("test*123*test");
  });

  it("continues an active intraword emphasis chain", () => {
    expect(remend("*foo*bar*baz")).toBe("*foo*bar*baz*");
    expect(remend("*file*name*ext")).toBe("*file*name*ext*");
  });

  it("completes a later incomplete run after a closed intraword pair", () => {
    expect(remend("before *a*b after *c")).toBe("before *a*b after *c*");
    expect(remend("*기울임*으로 *another")).toBe("*기울임*으로 *another*");
  });

  it("does not reopen after whitespace following a closed intraword pair", () => {
    expect(remend("*foo* bar*baz")).toBe("*foo* bar*baz");
  });
});
