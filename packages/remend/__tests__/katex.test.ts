import { describe, expect, it } from "vitest";
import remend from "../src";

describe("KaTeX block formatting ($$)", () => {
  it("should complete incomplete block KaTeX", () => {
    expect(remend("Text with $$formula")).toBe("Text with $$formula$$");
    expect(remend("$$incomplete")).toBe("$$incomplete$$");
  });

  it("should keep complete block KaTeX unchanged", () => {
    const text = "Text with $$E = mc^2$$";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple block KaTeX sections", () => {
    const text = "$$formula1$$ and $$formula2$$";
    expect(remend(text)).toBe(text);
  });

  it("should complete odd number of block KaTeX markers", () => {
    expect(remend("$$first$$ and $$second")).toBe("$$first$$ and $$second$$");
  });

  it("should handle block KaTeX at start of text", () => {
    expect(remend("$$x + y = z")).toBe("$$x + y = z$$");
  });

  it("should handle multiline block KaTeX", () => {
    expect(remend("$$\nx = 1\ny = 2")).toBe("$$\nx = 1\ny = 2\n$$");
  });
});

describe("KaTeX inline formatting ($)", () => {
  it("should NOT complete single dollar signs (likely currency)", () => {
    // Single dollar signs are likely currency, not math
    expect(remend("Text with $formula")).toBe("Text with $formula");
    expect(remend("$incomplete")).toBe("$incomplete");
  });

  it("should keep text with paired dollar signs unchanged", () => {
    // Even paired dollar signs are preserved but not treated as math
    const text = "Text with $x^2 + y^2 = z^2$";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple inline KaTeX sections", () => {
    const text = "$a = 1$ and $b = 2$";
    expect(remend(text)).toBe(text);
  });

  it("should NOT complete odd number of dollar signs", () => {
    // We don't auto-complete dollar signs anymore
    expect(remend("$first$ and $second")).toBe("$first$ and $second");
  });

  it("should not complete single $ but should complete block $$", () => {
    // Block math $$ is completed, single $ is not
    expect(remend("$$block$$ and $inline")).toBe("$$block$$ and $inline");
  });

  it("should NOT complete dollar sign at start of text", () => {
    // Single dollar sign is likely currency
    expect(remend("$x + y = z")).toBe("$x + y = z");
  });

  it("should handle escaped dollar signs", () => {
    const text = "Price is \\$100";
    expect(remend(text)).toBe(text);
  });

  it("should handle multiple consecutive dollar signs correctly", () => {
    expect(remend("$$$")).toBe("$$$$$");
    expect(remend("$$$$")).toBe("$$$$");
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
    expect(remend(chunks[0])).toBe(chunks[0]);
    expect(remend(chunks[1])).toBe("The formula $E");
    expect(remend(chunks[2])).toBe("The formula $E = mc");
    expect(remend(chunks[3])).toBe("The formula $E = mc^2");
    expect(remend(chunks[4])).toBe(chunks[4]);
  });
});

describe("math blocks with underscores", () => {
  it("should not complete underscores within inline math blocks", () => {
    const text = "The variable $x_1$ represents the first element";
    expect(remend(text)).toBe(text);

    const text2 = "Formula: $a_b + c_d = e_f$";
    expect(remend(text2)).toBe(text2);
  });

  it("should not complete underscores within block math", () => {
    const text = "$$x_1 + y_2 = z_3$$";
    expect(remend(text)).toBe(text);

    const text2 = "$$\na_1 + b_2\nc_3 + d_4\n$$";
    expect(remend(text2)).toBe(text2);
  });

  it("should not add underscore when math block has incomplete underscore", () => {
    // We no longer auto-complete single dollar signs
    // The underscore inside is not treated as italic since it's likely part of a variable name
    const text = "Math expression $x_";
    expect(remend(text)).toBe("Math expression $x_");

    const text2 = "$$formula_";
    expect(remend(text2)).toBe("$$formula_$$");
  });

  it("should handle underscores outside math blocks normally", () => {
    const text = "Text with _italic_ and math $x_1$";
    expect(remend(text)).toBe(text);

    const text2 = "_italic text_ followed by $a_b$";
    expect(remend(text2)).toBe(text2);
  });

  it("should complete italic underscore outside math but not inside", () => {
    const text = "Start _italic with $x_1$";
    expect(remend(text)).toBe("Start _italic with $x_1$_");
  });

  it("should handle complex math expressions with multiple underscores", () => {
    const text = "$x_1 + x_2 + x_3 = y_1$";
    expect(remend(text)).toBe(text);

    const text2 = "$$\\sum_{i=1}^{n} x_i = \\prod_{j=1}^{m} y_j$$";
    expect(remend(text2)).toBe(text2);
  });

  it("should handle escaped dollar signs correctly", () => {
    const text = "Price is \\$50 and _this is italic_";
    expect(remend(text)).toBe(text);

    const text2 = "Cost \\$100 with _incomplete";
    expect(remend(text2)).toBe("Cost \\$100 with _incomplete_");
  });

  it("should handle mixed inline and block math", () => {
    const text = "Inline $x_1$ and block $$y_2$$ math";
    expect(remend(text)).toBe(text);
  });

  it("should not interfere with complete math blocks when adding underscores outside", () => {
    const text = "_italic start $x_1$ italic end_";
    expect(remend(text)).toBe(text);
  });

  it("should not complete dollar signs in inline code blocks (#296)", () => {
    const str =
      "Streamdown uses double dollar signs (`$$`) to delimit mathematical expressions.";
    expect(remend(str)).toBe(str);
  });

  it("should handle multiple inline code blocks with $$ correctly (#296)", () => {
    const str = "Use `$$` for math blocks and `$$formula$$` for inline.";
    expect(remend(str)).toBe(str);
  });

  it("should complete $$ outside inline code but not inside (#296)", () => {
    const str = "Math: $$x+y and code: `$$`";
    expect(remend(str)).toBe("Math: $$x+y and code: `$$`$$");
  });

  it("should handle mixed $$ inside and outside code blocks (#296)", () => {
    const str = "$$formula$$ and code `$$` and $$incomplete";
    expect(remend(str)).toBe("$$formula$$ and code `$$` and $$incomplete$$");
  });
});

describe("math blocks with asterisks", () => {
  it("should not complete asterisks within block math", () => {
    const text = "$$\\mathbf{w}^{*}$$";
    expect(remend(text)).toBe(text);
  });

  it("should not complete asterisks in complex math expressions", () => {
    const text =
      "$$\n\\mathbf{w}^{*} = \\underset{\\|\\mathbf{w}\\|=1}{\\arg\\max} \\;\\; \\mathbf{w}^T S \\mathbf{w}\n$$";
    expect(remend(text)).toBe(text);
  });

  it("should handle asterisks outside math blocks normally", () => {
    const text = "Text with *italic* and math $$x^{*}$$";
    expect(remend(text)).toBe(text);
  });

  it("should complete italic asterisk outside math but not inside", () => {
    const text = "Start *italic with $$x^{*}$$";
    expect(remend(text)).toBe("Start *italic with $$x^{*}$$*");
  });
});
