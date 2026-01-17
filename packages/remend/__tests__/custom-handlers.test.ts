import { describe, expect, it } from "vitest";
import remend, {
  isWithinCodeBlock,
  isWithinLinkOrImageUrl,
  isWithinMathBlock,
  isWordChar,
  type RemendHandler,
} from "../src";

// Regex pattern for joke marker matching (moved to top level for performance)
const JOKE_MARKER_PATTERN = /<<<JOKE>>>([^<]*)$/;

describe("custom handlers", () => {
  it("should execute custom handlers", () => {
    const handler: RemendHandler = {
      name: "test",
      handle: (text) => text.replace(/foo/g, "bar"),
    };

    expect(remend("foo", { handlers: [handler] })).toBe("bar");
  });

  it("should execute custom handlers after built-in handlers by default", () => {
    const handler: RemendHandler = {
      name: "test",
      handle: (text) => `${text}!`,
    };

    // Bold should be completed first, then custom handler adds "!"
    expect(remend("**bold", { handlers: [handler] })).toBe("**bold**!");
  });

  it("should respect custom handler priority", () => {
    const results: string[] = [];

    const lowPriority: RemendHandler = {
      name: "low",
      priority: 200,
      handle: (text) => {
        results.push("low");
        return text;
      },
    };

    const highPriority: RemendHandler = {
      name: "high",
      priority: 5,
      handle: (text) => {
        results.push("high");
        return text;
      },
    };

    remend("test", { handlers: [lowPriority, highPriority] });
    expect(results).toEqual(["high", "low"]);
  });

  it("should allow custom handlers to run before built-ins", () => {
    const results: string[] = [];

    const beforeSetext: RemendHandler = {
      name: "beforeSetext",
      priority: -1, // Before setextHeadings (0)
      handle: (text) => {
        results.push("custom");
        return text;
      },
    };

    // This will run built-in handlers too, but our custom one should be first
    remend("test\n-", { handlers: [beforeSetext] });
    expect(results[0]).toBe("custom");
  });

  it("should handle multiple custom handlers", () => {
    const handler1: RemendHandler = {
      name: "replace-a",
      handle: (text) => text.replace(/a/g, "b"),
    };

    const handler2: RemendHandler = {
      name: "replace-b",
      handle: (text) => text.replace(/b/g, "c"),
    };

    expect(remend("aaa", { handlers: [handler1, handler2] })).toBe("ccc");
  });

  it("should handle custom handlers with same priority in order", () => {
    const results: string[] = [];

    const first: RemendHandler = {
      name: "first",
      priority: 100,
      handle: (text) => {
        results.push("first");
        return text;
      },
    };

    const second: RemendHandler = {
      name: "second",
      priority: 100,
      handle: (text) => {
        results.push("second");
        return text;
      },
    };

    remend("test", { handlers: [first, second] });
    // Array.sort is stable in modern JS, so order should be preserved
    expect(results).toEqual(["first", "second"]);
  });

  it("should work with disabled built-in handlers", () => {
    const handler: RemendHandler = {
      name: "test",
      handle: (text) => `${text}!`,
    };

    // Disable bold, custom handler still runs
    expect(remend("**bold", { bold: false, handlers: [handler] })).toBe(
      "**bold!"
    );
  });

  it("should work with no built-in handlers enabled", () => {
    const handler: RemendHandler = {
      name: "uppercase",
      handle: (text) => text.toUpperCase(),
    };

    expect(
      remend("hello", {
        bold: false,
        italic: false,
        boldItalic: false,
        inlineCode: false,
        strikethrough: false,
        katex: false,
        links: false,
        images: false,
        setextHeadings: false,
        handlers: [handler],
      })
    ).toBe("HELLO");
  });

  it("should handle empty handlers array", () => {
    expect(remend("**bold", { handlers: [] })).toBe("**bold**");
  });
});

describe("exported utilities", () => {
  describe("isWithinCodeBlock", () => {
    it("should detect position inside code block", () => {
      const text = "```\ncode\n```";
      expect(isWithinCodeBlock(text, 5)).toBe(true);
    });

    it("should detect position outside code block", () => {
      const text = "before ```code``` after";
      expect(isWithinCodeBlock(text, 2)).toBe(false);
    });
  });

  describe("isWithinMathBlock", () => {
    it("should detect position inside block math", () => {
      const text = "$$x^2$$";
      expect(isWithinMathBlock(text, 3)).toBe(true);
    });

    it("should detect position outside math", () => {
      const text = "before $x$ after";
      expect(isWithinMathBlock(text, 14)).toBe(false);
    });
  });

  describe("isWithinLinkOrImageUrl", () => {
    it("should detect position inside link URL", () => {
      const text = "[text](http://example.com)";
      expect(isWithinLinkOrImageUrl(text, 10)).toBe(true);
    });

    it("should detect position outside link", () => {
      const text = "before [text](url) after";
      expect(isWithinLinkOrImageUrl(text, 2)).toBe(false);
    });
  });

  describe("isWordChar", () => {
    it("should identify word characters", () => {
      expect(isWordChar("a")).toBe(true);
      expect(isWordChar("Z")).toBe(true);
      expect(isWordChar("5")).toBe(true);
      expect(isWordChar("_")).toBe(true);
    });

    it("should identify non-word characters", () => {
      expect(isWordChar(" ")).toBe(false);
      expect(isWordChar("*")).toBe(false);
      expect(isWordChar("")).toBe(false);
    });
  });
});

describe("custom handler example: joke marker", () => {
  it("should complete joke markers", () => {
    const jokeHandler: RemendHandler = {
      name: "joke",
      priority: 80,
      handle: (text) => {
        // Complete <<<JOKE>>> marks
        const match = text.match(JOKE_MARKER_PATTERN);
        if (match && !text.endsWith("<<</JOKE>>>")) {
          return `${text}<<</JOKE>>>`;
        }
        return text;
      },
    };

    expect(
      remend("<<<JOKE>>>Why did the chicken", { handlers: [jokeHandler] })
    ).toBe("<<<JOKE>>>Why did the chicken<<</JOKE>>>");
  });

  it("should not double-complete joke markers", () => {
    const jokeHandler: RemendHandler = {
      name: "joke",
      priority: 80,
      handle: (text) => {
        const match = text.match(JOKE_MARKER_PATTERN);
        if (match && !text.endsWith("<<</JOKE>>>")) {
          return `${text}<<</JOKE>>>`;
        }
        return text;
      },
    };

    expect(
      remend("<<<JOKE>>>complete<<</JOKE>>>", { handlers: [jokeHandler] })
    ).toBe("<<<JOKE>>>complete<<</JOKE>>>");
  });
});
