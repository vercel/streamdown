import { cn } from "../lib/utils";

describe("cn: logical and physical utilities are one axis", () => {
  const overrides: [string, string, string][] = [
    ["ps-4", "pl-2", "pl-2"],
    ["pl-4", "ps-2", "ps-2"],
    ["pe-4", "pr-2", "pr-2"],
    ["ms-1", "ml-3", "ml-3"],
    ["ml-1", "ms-3", "ms-3"],
    ["border-s-4", "border-l-2", "border-l-2"],
    ["border-l-4", "border-s-2", "border-s-2"],
    ["end-0", "right-2", "right-2"],
    ["start-0", "left-2", "left-2"],
    ["text-start", "text-left", "text-left"],
    ["pl-4", "pl-2", "pl-2"],
    ["ps-4", "ps-2", "ps-2"],
  ];
  for (const [base, override, expected] of overrides) {
    it(`cn("${base}", "${override}") === "${expected}"`, () => {
      expect(cn(base, override)).toBe(expected);
    });
  }

  const untouched: [string, string][] = [
    ["ps-4", "pt-2"],
    ["ps-4", "mr-2"],
    ["border-s-4", "pl-2"],
    ["end-0", "top-2"],
  ];
  for (const [a, b] of untouched) {
    it(`cn("${a}", "${b}") keeps both — different axes`, () => {
      expect(cn(a, b)).toBe(`${a} ${b}`);
    });
  }

  // A narrow utility after a broad one is a legitimate combination; the
  // logical form must behave exactly as the physical form already does.
  const parity: [string, string, string][] = [
    ["px-4", "pl-2", "ps-2"],
    ["mx-4", "ml-2", "ms-2"],
    ["border-x-4", "border-l-2", "border-s-2"],
    ["inset-x-0", "left-2", "start-2"],
  ];
  for (const [broad, physical, logical] of parity) {
    it(`cn("${broad}", "${logical}") resolves like cn("${broad}", "${physical}")`, () => {
      expect(cn(broad, logical).split(" ").length).toBe(
        cn(broad, physical).split(" ").length
      );
    });
  }

  it("blockquote: a consumer override wins cleanly instead of doubling up", () => {
    expect(
      cn("my-4 border-muted-foreground/30 border-s-4 ps-4 italic", "pl-8")
    ).toBe("my-4 border-muted-foreground/30 border-s-4 italic pl-8");
  });
});
