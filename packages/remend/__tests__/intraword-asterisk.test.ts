import { describe, expect, it } from "vitest";
import remend from "../src";

describe("intraword asterisk emphasis", () => {
  it.each([
    "*foo*bar",
    "this is *real*ly good",
    "이것은 *기울임*으로 표시",
    "5*6*78",
  ])("keeps complete emphasis unchanged: %s", (text) => {
    expect(remend(text)).toBe(text);
  });

  it("leaves a lone intraword asterisk literal", () => {
    expect(remend("foo*bar")).toBe("foo*bar");
  });

  it("continues an active intraword emphasis chain", () => {
    expect(remend("*foo*bar*baz")).toBe("*foo*bar*baz*");
  });
});
