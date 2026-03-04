import { describe, expect, it } from "vitest";
import remend from "../src";
import { countTripleAsterisks } from "../src/emphasis-handlers";
import {
  isHorizontalRule,
  isWithinHtmlTag,
  isWithinLinkOrImageUrl,
  isWithinMathBlock,
} from "../src/utils";

describe("empty string through handler pipeline", () => {
  it("should handle single space input", () => {
    expect(remend(" ")).toBe("");
  });
});

describe("half-complete double underscore closing", () => {
  it("should complete __content_ to __content__", () => {
    expect(remend("__content_")).toBe("__content__");
  });
});

describe("underscore with trailing double asterisks", () => {
  it("should close underscore when trailing ** is unrelated", () => {
    expect(remend("_text**")).toBe("_text**_");
  });
});

describe("bold-italic inside code block", () => {
  it("should not complete *** markers inside code blocks", () => {
    expect(remend("```\n***bold")).toBe("```\n***bold");
  });

  it("should complete *** outside code block with *** inside", () => {
    expect(remend("```\n***\n```\n***text")).toBe("```\n***\n```\n***text***");
  });
});

describe("countTripleAsterisks", () => {
  it("should count trailing *** at end of text", () => {
    expect(countTripleAsterisks("text***")).toBe(1);
  });

  it("should skip *** inside code blocks", () => {
    expect(countTripleAsterisks("```\n***\n```")).toBe(0);
  });

  it("should count *** outside but not inside code blocks", () => {
    expect(countTripleAsterisks("```\n***\n```\n***")).toBe(1);
  });

  it("should flush pending asterisks before code block toggle", () => {
    expect(countTripleAsterisks("***```code```")).toBe(1);
  });
});

describe("single underscore counting with code blocks", () => {
  it("should skip _ inside fenced code blocks", () => {
    expect(remend("```\n_code\n```\n_text")).toBe("```\n_code\n```\n_text_");
  });
});

describe("setext heading with equals sign edge cases", () => {
  it("should not modify equals when previous line is empty", () => {
    expect(remend("\n=")).toBe("\n=");
  });

  it("should not modify double equals when previous line is empty", () => {
    expect(remend("\n==")).toBe("\n==");
  });
});

describe("strikethrough even tilde pairs", () => {
  it("should not close when tilde pairs are balanced", () => {
    expect(remend("a~~b~~text")).toBe("a~~b~~text");
  });

  it("should not close half-complete tilde when pairs are balanced", () => {
    expect(remend("a~~b~~c~")).toBe("a~~b~~c~");
  });
});

describe("double underscore counting with code blocks", () => {
  it("should skip __ inside fenced code blocks", () => {
    expect(remend("```\n__code\n```\n__text")).toBe(
      "```\n__code\n```\n__text__"
    );
  });
});

describe("link handler edge cases", () => {
  it("should handle ]( without matching opening bracket", () => {
    expect(remend("](partial")).toBe("](partial");
  });

  it("should skip image brackets in text-only mode", () => {
    expect(remend("![img [text", { linkMode: "text-only" })).toBe("![img text");
  });

  it("should skip complete links in text-only mode", () => {
    expect(remend("[link](url) [incomplete", { linkMode: "text-only" })).toBe(
      "[link](url) incomplete"
    );
  });

  it("should handle complete bracket pair without link in text-only mode", () => {
    expect(remend("[text] [incomplete", { linkMode: "text-only" })).toBe(
      "[text] incomplete"
    );
  });
});

describe("isBeforeClosingParen edge cases", () => {
  it("should return false when newline found before )", () => {
    expect(isWithinLinkOrImageUrl("[t](_\nmore)", 4)).toBe(false);
  });

  it("should return false when text ends without ) or newline", () => {
    expect(isWithinLinkOrImageUrl("[t](_noclose", 4)).toBe(false);
  });
});

describe("isWithinLinkOrImageUrl — ) found before (", () => {
  it("should return false when ) precedes the position", () => {
    expect(isWithinLinkOrImageUrl("[text](url) _after", 12)).toBe(false);
  });

  it("should handle underscore after complete link", () => {
    expect(remend("[link](url) _word")).toBe("[link](url) _word_");
  });
});

describe("isWithinLinkOrImageUrl edge cases", () => {
  it("should return false for bare ( not preceded by ]", () => {
    expect(isWithinLinkOrImageUrl("func(arg)", 5)).toBe(false);
  });

  it("should handle underscore after bare parenthesis", () => {
    expect(remend("func(_arg")).toBe("func(_arg_");
  });
});

describe("isWithinHtmlTag edge cases", () => {
  it("should return false when > is found first", () => {
    expect(isWithinHtmlTag("div>text", 5)).toBe(false);
  });

  it("should return false for invalid tag start after <", () => {
    expect(isWithinHtmlTag("3<5 text", 4)).toBe(false);
  });

  it("should return false when newline found before < or >", () => {
    expect(isWithinHtmlTag("<div\ntext", 6)).toBe(false);
  });

  it("should handle underscore after > character", () => {
    expect(remend("div> _text")).toBe("div> _text_");
  });

  it("should handle underscore near < with invalid tag start", () => {
    expect(remend("3<5 _text")).toBe("3<5 _text_");
  });

  it("should handle underscore on new line after HTML element", () => {
    expect(remend("<div>\n_text")).toBe("<div>\n_text_");
  });

  it("should return true for uppercase tag", () => {
    expect(isWithinHtmlTag("<DIV class='_test'>", 13)).toBe(true);
  });

  it("should return true for closing tag with /", () => {
    expect(isWithinHtmlTag("</div _attr>", 6)).toBe(true);
  });

  it("should return false when < is at end of text", () => {
    expect(isWithinHtmlTag("text<", 5)).toBe(false);
  });
});

describe("underscore inside link URL", () => {
  it("should not close underscore that is part of a link URL", () => {
    expect(remend("[link](a_b) _word")).toBe("[link](a_b) _word_");
  });
});

describe("isWithinMathBlock branch coverage", () => {
  it("should ignore single $ inside block math", () => {
    expect(isWithinMathBlock("$$x$y$$z", 5)).toBe(true);
  });
});

describe("double underscore half-complete in code block", () => {
  it("should not complete __content_ inside code block", () => {
    expect(remend("```\n__content_")).toBe("```\n__content_");
  });
});

describe("double underscore half-complete with even pairs", () => {
  it("should not complete when __ pairs are balanced", () => {
    expect(remend("__a__ __b__content_")).toBe("__a__ __b__content_");
  });
});

describe("findFirstIncompleteBracket with incomplete URL", () => {
  it("should handle [text]( without ) before incomplete bracket", () => {
    expect(remend("[a]( b](c [incomplete", { linkMode: "text-only" })).toBe(
      "[a]( b](c incomplete"
    );
  });
});

describe("isHorizontalRule branch coverage", () => {
  it("should detect horizontal rule with spaces between markers", () => {
    expect(isHorizontalRule("* * *", 0, "*")).toBe(true);
  });

  it("should detect horizontal rule with tabs between markers", () => {
    expect(isHorizontalRule("*\t*\t*", 0, "*")).toBe(true);
  });
});
