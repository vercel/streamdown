import type { Link, Root, Text } from "mdast";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { cjkPlugin, createCjkPlugin } from "../index";

describe("cjkPlugin", () => {
  describe("plugin properties", () => {
    it("should have correct name and type", () => {
      expect(cjkPlugin.name).toBe("cjk");
      expect(cjkPlugin.type).toBe("cjk");
    });

    it("should have remarkPlugins array", () => {
      expect(cjkPlugin.remarkPlugins).toBeDefined();
      expect(Array.isArray(cjkPlugin.remarkPlugins)).toBe(true);
    });

    it("should have 3 remark plugins", () => {
      expect(cjkPlugin.remarkPlugins.length).toBe(3);
    });
  });
});

describe("createCjkPlugin", () => {
  it("should create plugin with correct properties", () => {
    const plugin = createCjkPlugin();
    expect(plugin.name).toBe("cjk");
    expect(plugin.type).toBe("cjk");
    expect(plugin.remarkPlugins).toBeDefined();
    expect(Array.isArray(plugin.remarkPlugins)).toBe(true);
  });

  it("should create independent plugin instances", () => {
    const plugin1 = createCjkPlugin();
    const plugin2 = createCjkPlugin();

    expect(plugin1).not.toBe(plugin2);
    expect(plugin1.remarkPlugins).not.toBe(plugin2.remarkPlugins);
  });
});

describe("CJK autolink boundary splitting", () => {
  const processMarkdown = async (markdown: string) => {
    const [autolinkBoundaryPlugin] = cjkPlugin.remarkPlugins;

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
    const tree = await processMarkdown("访问 www.example.com。谢谢");
    const links = getLinks(tree);

    expect(links.length).toBe(1);
    // GFM autolink converts www to https
    expect(links[0].url.includes("example.com")).toBe(true);
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
    const [autolinkBoundaryPlugin] = cjkPlugin.remarkPlugins;

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
