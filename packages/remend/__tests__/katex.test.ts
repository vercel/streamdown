import { describe, expect, it } from "vitest";
import { parseIncompleteMarkdown } from "../src";

describe("KaTeX block formatting ($$)", () => {
  it("should complete incomplete block KaTeX", () => {
    expect(parseIncompleteMarkdown("Text with $$formula")).toBe(
      "Text with $$formula$$"
    );
    expect(parseIncompleteMarkdown("$$incomplete")).toBe("$$incomplete$$");
  });

  it("should keep complete block KaTeX unchanged", () => {
    const text = "Text with $$E = mc^2$$";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple block KaTeX sections", () => {
    const text = "$$formula1$$ and $$formula2$$";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should complete odd number of block KaTeX markers", () => {
    expect(parseIncompleteMarkdown("$$first$$ and $$second")).toBe(
      "$$first$$ and $$second$$"
    );
  });

  it("should handle block KaTeX at start of text", () => {
    expect(parseIncompleteMarkdown("$$x + y = z")).toBe("$$x + y = z$$");
  });

  it("should handle multiline block KaTeX", () => {
    expect(parseIncompleteMarkdown("$$\nx = 1\ny = 2")).toBe(
      "$$\nx = 1\ny = 2\n$$"
    );
  });
});

describe("KaTeX inline formatting ($)", () => {
  it("should NOT complete single dollar signs (likely currency)", () => {
    // Single dollar signs are likely currency, not math
    expect(parseIncompleteMarkdown("Text with $formula")).toBe(
      "Text with $formula"
    );
    expect(parseIncompleteMarkdown("$incomplete")).toBe("$incomplete");
  });

  it("should keep text with paired dollar signs unchanged", () => {
    // Even paired dollar signs are preserved but not treated as math
    const text = "Text with $x^2 + y^2 = z^2$";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple inline KaTeX sections", () => {
    const text = "$a = 1$ and $b = 2$";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should NOT complete odd number of dollar signs", () => {
    // We don't auto-complete dollar signs anymore
    expect(parseIncompleteMarkdown("$first$ and $second")).toBe(
      "$first$ and $second"
    );
  });

  it("should not complete single $ but should complete block $$", () => {
    // Block math $$ is completed, single $ is not
    expect(parseIncompleteMarkdown("$$block$$ and $inline")).toBe(
      "$$block$$ and $inline"
    );
  });

  it("should NOT complete dollar sign at start of text", () => {
    // Single dollar sign is likely currency
    expect(parseIncompleteMarkdown("$x + y = z")).toBe("$x + y = z");
  });

  it("should handle escaped dollar signs", () => {
    const text = "Price is \\$100";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should handle multiple consecutive dollar signs correctly", () => {
    expect(parseIncompleteMarkdown("$$$")).toBe("$$$$$");
    expect(parseIncompleteMarkdown("$$$$")).toBe("$$$$");
  });

  it("should handle mathematical expression chunks", () => {
    const chunks = [
      "The formula",
      "The formula $E",
      "The formula $E = mc",
      "The formula $E = mc^2",
      "The formula $E = mc^2$ shows",
    ];

    // Single dollar signs are not auto-completed (likely currency)
    expect(parseIncompleteMarkdown(chunks[0])).toBe(chunks[0]);
    expect(parseIncompleteMarkdown(chunks[1])).toBe("The formula $E");
    expect(parseIncompleteMarkdown(chunks[2])).toBe("The formula $E = mc");
    expect(parseIncompleteMarkdown(chunks[3])).toBe("The formula $E = mc^2");
    expect(parseIncompleteMarkdown(chunks[4])).toBe(chunks[4]);
  });
});

describe("math blocks with underscores", () => {
  it("should not complete underscores within inline math blocks", () => {
    const text = "The variable $x_1$ represents the first element";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "Formula: $a_b + c_d = e_f$";
    expect(parseIncompleteMarkdown(text2)).toBe(text2);
  });

  it("should not complete underscores within block math", () => {
    const text = "$$x_1 + y_2 = z_3$$";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "$$\na_1 + b_2\nc_3 + d_4\n$$";
    expect(parseIncompleteMarkdown(text2)).toBe(text2);
  });

  it("should not add underscore when math block has incomplete underscore", () => {
    // We no longer auto-complete single dollar signs
    // The underscore inside is not treated as italic since it's likely part of a variable name
    const text = "Math expression $x_";
    expect(parseIncompleteMarkdown(text)).toBe("Math expression $x_");

    const text2 = "$$formula_";
    expect(parseIncompleteMarkdown(text2)).toBe("$$formula_$$");
  });

  it("should handle underscores outside math blocks normally", () => {
    const text = "Text with _italic_ and math $x_1$";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "_italic text_ followed by $a_b$";
    expect(parseIncompleteMarkdown(text2)).toBe(text2);
  });

  it("should complete italic underscore outside math but not inside", () => {
    const text = "Start _italic with $x_1$";
    expect(parseIncompleteMarkdown(text)).toBe("Start _italic with $x_1$_");
  });

  it("should handle complex math expressions with multiple underscores", () => {
    const text = "$x_1 + x_2 + x_3 = y_1$";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "$$\\sum_{i=1}^{n} x_i = \\prod_{j=1}^{m} y_j$$";
    expect(parseIncompleteMarkdown(text2)).toBe(text2);
  });

  it("should handle escaped dollar signs correctly", () => {
    const text = "Price is \\$50 and _this is italic_";
    expect(parseIncompleteMarkdown(text)).toBe(text);

    const text2 = "Cost \\$100 with _incomplete";
    expect(parseIncompleteMarkdown(text2)).toBe(
      "Cost \\$100 with _incomplete_"
    );
  });

  it("should handle mixed inline and block math", () => {
    const text = "Inline $x_1$ and block $$y_2$$ math";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });

  it("should not interfere with complete math blocks when adding underscores outside", () => {
    const text = "_italic start $x_1$ italic end_";
    expect(parseIncompleteMarkdown(text)).toBe(text);
  });
});
