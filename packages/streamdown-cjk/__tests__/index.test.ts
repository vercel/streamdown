import type { Link, Root, Text } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { cjk, createCjkPlugin } from "../index";

describe("cjk", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(cjk.name).toBe("cjk");
      expect(cjk.type).toBe("cjk");
    });

    it("should have remarkPluginsBefore array", () => {
      expect(cjk.remarkPluginsBefore).toBeDefined();
      expect(Array.isArray(cjk.remarkPluginsBefore)).toBe(true);
      expect(cjk.remarkPluginsBefore.length).toBe(1);
    });

    it("should have remarkPluginsAfter array", () => {
      expect(cjk.remarkPluginsAfter).toBeDefined();
      expect(Array.isArray(cjk.remarkPluginsAfter)).toBe(true);
      expect(cjk.remarkPluginsAfter.length).toBe(2);
    });

    it("should have remarkPlugins array for backwards compatibility", () => {
      expect(cjk.remarkPlugins).toBeDefined();
      expect(Array.isArray(cjk.remarkPlugins)).toBe(true);
      expect(cjk.remarkPlugins.length).toBe(3);
    });
  });
});

describe("createCjkPlugin", () => {
  it("should create plugin with correct properties", () => {
    const plugin = createCjkPlugin();
    expect(plugin.name).toBe("cjk");
    expect(plugin.type).toBe("cjk");
    expect(plugin.remarkPluginsBefore).toBeDefined();
    expect(plugin.remarkPluginsAfter).toBeDefined();
    expect(plugin.remarkPlugins).toBeDefined();
  });

  it("should create independent plugin instances", () => {
    const plugin1 = createCjkPlugin();
    const plugin2 = createCjkPlugin();

    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.remarkPluginsBefore).not.toBe(plugin2.remarkPluginsBefore);
    expect(plugin1.remarkPluginsAfter).not.toBe(plugin2.remarkPluginsAfter);
  });
});

describe("CJK autolink boundary splitting", () => {
  const processMarkdown = async (markdown: string) => {
    // Autolink boundary plugin is in the "after" array (runs after remarkGfm)
    const [autolinkBoundaryPlugin] = cjk.remarkPluginsAfter;

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(autolinkBoundaryPlugin)
      .use(remarkStringify);

    const result = await processor.run(processor.parse(markdown));
    return result as Root;
  };

  const getLinks = (tree: Root): Link[] => {
    const links: Link[] = [];
    visit(tree, "link", (node: Link) => {
      links.push(node);
    });
    return links;
  };

  const getTexts = (tree: Root): Text[] => {
    const texts: Text[] = [];
    visit(tree, "text", (node: Text) => {
      texts.push(node);
    });
    return texts;
  };

  it("should split autolink at CJK full stop", async () => {
    const tree = await processMarkdown("请访问 https://example.com。谢谢");
    const links = getLinks(tree);
    const texts = getTexts(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");

    const allText = texts.map((t) => t.value).join("");
    expect(allText).toContain("。谢谢");
  });

  it("should split autolink at ideographic comma", async () => {
    const tree = await processMarkdown("链接 https://example.com，更多文字");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");
  });

  it("should split autolink at CJK question mark", async () => {
    const tree = await processMarkdown("是否访问 https://example.com？");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");
  });

  it("should split autolink at CJK exclamation mark", async () => {
    const tree = await processMarkdown("访问 https://example.com！");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");
  });

  it("should split autolink at CJK colon", async () => {
    const tree = await processMarkdown("链接：https://example.com：后面的文字");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");
  });

  it("should split autolink at CJK parentheses", async () => {
    const tree = await processMarkdown("（https://example.com）");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com");
  });

  it("should split autolink at various CJK brackets", async () => {
    const brackets = [
      ["【", "】"],
      ["「", "」"],
      ["『", "』"],
      ["〈", "〉"],
      ["《", "》"],
    ];

    for (const [open, close] of brackets) {
      const tree = await processMarkdown(`${open}https://example.com${close}`);
      const links = getLinks(tree);

      expect(links.length).toBe(1);
      expect(links[0].url).toBe("https://example.com");
    }
  });

  it("should not split non-autolinks", async () => {
    const tree = await processMarkdown("[链接](https://example.com。谢谢)");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    // Non-autolinks keep the full URL
    expect(links[0].url).toBe("https://example.com。谢谢");
  });

  it("should not split autolinks without CJK punctuation", async () => {
    const tree = await processMarkdown(
      "Visit https://example.com/path for more"
    );
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com/path");
  });

  it("should handle multiple autolinks with CJK punctuation", async () => {
    const tree = await processMarkdown(
      "访问 https://example.com。还有 https://test.com！"
    );
    const links = getLinks(tree);

    expect(links.length).toBe(2);
    expect(links[0].url).toBe("https://example.com");
    expect(links[1].url).toBe("https://test.com");
  });

  it("should handle mailto links", async () => {
    const tree = await processMarkdown("邮件：mailto:test@example.com。谢谢");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("mailto:test@example.com");
  });

  it("should handle www links", async () => {
    const tree = await processMarkdown("访问 www.example.com 谢谢");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    // GFM autolink converts www to http(s)
    expect(new URL(links[0].url).hostname).toBe("www.example.com");
  });

  it("should not split if CJK punctuation is at start of URL", async () => {
    // This shouldn't match the autolink pattern anyway
    const tree = await processMarkdown("。https://example.com");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    // URL starts after the punctuation
    expect(links[0].url).toBe("https://example.com");
  });
});

describe("CJK autolink edge cases", () => {
  const processMarkdown = async (markdown: string) => {
    const [autolinkBoundaryPlugin] = cjk.remarkPluginsAfter;

    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(autolinkBoundaryPlugin)
      .use(remarkStringify);

    const result = await processor.run(processor.parse(markdown));
    return result as Root;
  };

  const getLinks = (tree: Root): Link[] => {
    const links: Link[] = [];
    visit(tree, "link", (node: Link) => links.push(node));
    return links;
  };

  it("should not split links with multiple children (non-autolinks)", async () => {
    // Markdown links like [text **bold**](url) have multiple children
    const tree = await processMarkdown(
      "[Visit **here**](https://example.com。test)"
    );
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    // Link with multiple children should not be treated as autolink
    expect(links[0].url).toBe("https://example.com。test");
  });

  it("should not split links where text differs from URL", async () => {
    // [custom text](url) is not an autolink literal
    const tree = await processMarkdown(
      "[Click me](https://example.com。something)"
    );
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    expect(links[0].url).toBe("https://example.com。something");
  });

  it("should not split non-http/mailto/www URLs", async () => {
    // ftp:// and other protocols should not be split
    const tree = await processMarkdown("ftp://example.com。test");
    // This won't be an autolink (GFM only autolinks http/https/mailto/www)
    const links = getLinks(tree);
    expect(links.length).toBe(0);
  });
});

describe("CJK autolink boundary plugin direct AST tests", () => {
  const getPluginTransform = () => {
    const plugin = cjk.remarkPluginsAfter[0] as () => (tree: Root) => void;
    return plugin();
  };

  it("should skip link nodes without parent (defensive guard)", () => {
    const transform = getPluginTransform();

    // When root itself is a link, visit calls back with parent=undefined
    const tree = {
      type: "link",
      url: "https://example.com。test",
      children: [{ type: "text", value: "https://example.com。test" }],
    } as unknown as Root;

    transform(tree);

    // Should be unchanged — the guard returns early
    expect((tree as unknown as Link).url).toBe("https://example.com。test");
  });

  it("should skip autolink literals without recognized URL prefix", () => {
    const transform = getPluginTransform();

    const tree: Root = {
      type: "root",
      children: [
        {
          type: "link",
          url: "ftp://example.com。test",
          children: [{ type: "text", value: "ftp://example.com。test" }],
        } as Link,
      ],
    };

    transform(tree);

    // Should be unchanged — non-http/mailto/www URLs are skipped
    expect((tree.children[0] as Link).url).toBe("ftp://example.com。test");
  });
});

describe("CJK punctuation boundary characters", () => {
  const CJK_PUNCTUATION = [
    "。", // Ideographic full stop
    "．", // Fullwidth full stop
    "，", // Fullwidth comma
    "、", // Ideographic comma
    "？", // Fullwidth question mark
    "！", // Fullwidth exclamation mark
    "：", // Fullwidth colon
    "；", // Fullwidth semicolon
    "（", // Fullwidth left parenthesis
    "）", // Fullwidth right parenthesis
    "【", // Left black lenticular bracket
    "】", // Right black lenticular bracket
    "「", // Left corner bracket
    "」", // Right corner bracket
    "『", // Left white corner bracket
    "』", // Right white corner bracket
    "〈", // Left angle bracket
    "〉", // Right angle bracket
    "《", // Left double angle bracket
    "》", // Right double angle bracket
  ];

  it("should recognize all CJK punctuation characters", async () => {
    // Autolink boundary plugin is in the "after" array (runs after remarkGfm)
    const [autolinkBoundaryPlugin] = cjk.remarkPluginsAfter;

    for (const punct of CJK_PUNCTUATION) {
      const markdown = `https://example.com${punct}后`;

      const processor = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .use(autolinkBoundaryPlugin)
        .use(remarkStringify);

      const tree = (await processor.run(processor.parse(markdown))) as Root;
      const links: Link[] = [];
      visit(tree, "link", (node: Link) => links.push(node));

      expect(links.length).toBe(1);
      expect(links[0].url).toBe("https://example.com");
    }
  });
});
