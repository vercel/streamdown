import { describe, expect, it } from "vitest";
import remend from "../src";
import { getScan, inAutolinkUrlAt } from "../src/scan";

// Double underscores are counted per maximal run with flanking rules, so
// identifiers containing __ (snake__case style) neither invent nor swallow
// emphasis delimiters.
describe("word-internal double underscores", () => {
  it("should not treat an identifier's __ as a delimiter", () => {
    expect(remend("fields user__id and org__id are join keys")).toBe(
      "fields user__id and org__id are join keys"
    );
  });

  it("should still close an opener when an identifier follows", () => {
    // Counting raw __ occurrences would pair the identifier's run against
    // the opener and swallow the closer that is still needed
    expect(remend("Use snake__case and __bold")).toBe(
      "Use snake__case and __bold__"
    );
  });

  it("should not invent a closer for a lone identifier", () => {
    expect(remend("the value of some__field is set")).toBe(
      "the value of some__field is set"
    );
  });

  it("should not complete underscores that belong to a CJK autolink", () => {
    const markdown = "foo__https://example.com/__、英語版";

    expect(remend(markdown)).toBe(markdown);
  });

  it("should count GFM-trimmed URL underscores as emphasis delimiters", () => {
    const markdown = "__bold https://example.com/path__,";

    expect(remend(markdown)).toBe(markdown);
  });

  it("should not mask URL-like text that GFM would not autolink", () => {
    expect(remend("foohttps://example.com/__bold")).toBe(
      "foohttps://example.com/__bold__"
    );
  });

  it("should not mask protocol text with a host rejected by GFM", () => {
    expect(remend("https://__bold")).toBe("https://__bold__");
  });

  it("should match GFM host boundaries at Unicode symbol characters", () => {
    const markdown = "https://foo$bar_.com/__bold";

    expect(inAutolinkUrlAt(getScan(markdown), markdown.indexOf("__"))).toBe(
      true
    );
    expect(remend(markdown)).toBe(markdown);
  });

  it("should mask supplementary symbols accepted inside GFM hosts", () => {
    const markdown = "https://💰foo.com/__bold";

    expect(inAutolinkUrlAt(getScan(markdown), markdown.indexOf("__"))).toBe(
      true
    );
    expect(remend(markdown)).toBe(markdown);
  });

  it("should mask a single-label host accepted by GFM", () => {
    const markdown = "https://example/__bold";

    expect(remend(markdown)).toBe(markdown);
  });

  it("should mask localhost autolinks accepted by GFM", () => {
    const markdown = "https://localhost/__bold";

    expect(remend(markdown)).toBe(markdown);
  });

  it("should mask a protocol autolink with a dotted IPv4 host", () => {
    const markdown = "https://127.0.0.1/__bold";

    expect(remend(markdown)).toBe(markdown);
  });

  it("should still complete emphasis after a CJK autolink boundary", () => {
    expect(remend("https://example.com，__bold")).toBe(
      "https://example.com，__bold__"
    );
  });

  it("should complete an open emphasis span after a CJK autolink", () => {
    const markdown = "__bold https://example.com/path__、";

    expect(remend(markdown)).toBe(`${markdown}__`);
  });

  it("should ignore identifiers inside complete inline code", () => {
    expect(remend("`obj__attr` and __bold")).toBe("`obj__attr` and __bold__");
  });

  it("should ignore identifiers inside bold content", () => {
    expect(remend("**bold snake__case text** and more")).toBe(
      "**bold snake__case text** and more"
    );
  });
});

describe("GFM autolink URL mask", () => {
  it("matches protocol URLs after digits and non-ASCII letters", () => {
    for (const prefix of ["1", "中"]) {
      const text = `${prefix}https://example.com/__bold`;

      expect(inAutolinkUrlAt(getScan(text), text.indexOf("__"))).toBe(true);
    }
  });

  it("matches protocol autolinks after unmatched link and image openers", () => {
    for (const prefix of ["[", "!["]) {
      const text = `${prefix}https://example.com/__bold`;

      expect(inAutolinkUrlAt(getScan(text), text.indexOf("__"))).toBe(true);
    }
  });

  it("does not mask protocol URLs inside actual inline link and image labels", () => {
    for (const text of [
      "[label https://example.com/__bold](target)",
      '[label https://example.com/__bold](target "title")',
      "[label https://example.com/__bold](<target path>)",
      "[label https://example.com/__bold](target_(nested))",
      '[label https://example.com/__bold]( "title")',
      "[label https://example.com/__bold]( 'title')",
      "[label https://example.com/__bold]( (title))",
      "![label https://example.com/__bold](target)",
      "[label\nhttps://example.com/__bold](target)",
    ]) {
      expect(inAutolinkUrlAt(getScan(text), text.indexOf("__"))).toBe(false);
    }
  });

  it("does not treat invalid inline link destinations as link labels", () => {
    const markdown = "[label https://example.com/__bold](target space)";

    expect(inAutolinkUrlAt(getScan(markdown), markdown.indexOf("__"))).toBe(
      true
    );
  });

  it("ignores escaped and code-span brackets when tracking labels", () => {
    const escapedBracket = "\\[https://example.com/__bold";
    const escapedSlashPair = "\\\\[https://example.com/__bold";
    const codeBracket = "`[` https://example.com/__bold";

    expect(
      inAutolinkUrlAt(getScan(escapedBracket), escapedBracket.indexOf("__"))
    ).toBe(true);
    expect(
      inAutolinkUrlAt(getScan(escapedSlashPair), escapedSlashPair.indexOf("__"))
    ).toBe(true);
    expect(
      inAutolinkUrlAt(getScan(codeBracket), codeBracket.indexOf("__"))
    ).toBe(true);
  });

  it("does not track brackets inside a recognized URL", () => {
    const text = "https://example.com/a[b https://other.com/__bold";

    expect(inAutolinkUrlAt(getScan(text), text.lastIndexOf("__"))).toBe(true);
  });

  it("scans nested URL prefixes without rescanning an autolink suffix", () => {
    const nestedUrl = "https://example.com/__".repeat(4096);
    const text = `${nestedUrl}、https://after.example/__tail`;

    expect(inAutolinkUrlAt(getScan(text), nestedUrl.lastIndexOf("__"))).toBe(
      true
    );
    expect(inAutolinkUrlAt(getScan(text), text.lastIndexOf("__"))).toBe(true);
  });

  it("matches autolinks across paragraph and block boundaries", () => {
    const markdown = [
      "[label\n\nhttps://example.com/__bold",
      "[label\nhttps://example.com/__bold",
      "[label\n# https://example.com/__bold",
      "[label\n- https://example.com/__bold",
      "[label\n> https://example.com/__bold",
      "- [label\n  https://example.com/__bold",
      "> [label\n> https://example.com/__bold",
      "# https://example.com/__bold",
      "- https://example.com/__bold",
      "> https://example.com/__bold",
    ];

    for (const text of markdown) {
      expect(inAutolinkUrlAt(getScan(text), text.indexOf("__"))).toBe(true);
    }
  });

  it("does not pair link labels across blocks but allows quote lazy continuation", () => {
    const enteringQuote = "[label\n> https://example.com/__bold](target)";
    const quoteLazyContinuation =
      "> [label\nhttps://example.com/__bold](target)";
    const separatedQuote = "> [label\n\nhttps://example.com/__bold](target)";

    expect(
      inAutolinkUrlAt(getScan(enteringQuote), enteringQuote.indexOf("__"))
    ).toBe(true);
    expect(
      inAutolinkUrlAt(
        getScan(quoteLazyContinuation),
        quoteLazyContinuation.indexOf("__")
      )
    ).toBe(false);
    expect(
      inAutolinkUrlAt(getScan(separatedQuote), separatedQuote.indexOf("__"))
    ).toBe(true);
  });

  it("matches autolinks in plain bracket text but not real inline link labels", () => {
    const bracketText = "[label https://example.com/__bold]";
    const linkLabel = "[label https://example.com/__bold__](target)";

    expect(
      inAutolinkUrlAt(getScan(bracketText), bracketText.indexOf("__"))
    ).toBe(true);
    expect(remend(bracketText)).toBe(bracketText);
    expect(inAutolinkUrlAt(getScan(linkLabel), linkLabel.indexOf("__"))).toBe(
      false
    );
    expect(remend(linkLabel)).toBe(linkLabel);
  });

  it("stops autolink masks before GFM trailing bracket openers", () => {
    const afterInlineLinkOpener = "https://example.com/path](__bold";
    const afterReferenceLinkOpener = "https://example.com/path][__bold";

    for (const markdown of [afterInlineLinkOpener, afterReferenceLinkOpener]) {
      expect(inAutolinkUrlAt(getScan(markdown), markdown.indexOf("__"))).toBe(
        false
      );
      expect(remend(markdown, { links: false, images: false })).toBe(
        `${markdown}__`
      );
    }
  });

  it("allows GFM trailing underscores to close emphasis before bracket openers", () => {
    const beforeInlineLinkOpener = "__bold https://example.com/path__](";
    const beforeReferenceLinkOpener = "__bold https://example.com/path__][";

    for (const markdown of [
      beforeInlineLinkOpener,
      beforeReferenceLinkOpener,
    ]) {
      const scan = getScan(markdown);
      const trailingUnderscores = markdown.indexOf("__", 2);

      expect(inAutolinkUrlAt(scan, markdown.indexOf("https://") + 8)).toBe(
        true
      );
      expect(inAutolinkUrlAt(scan, trailingUnderscores)).toBe(false);
      expect(remend(markdown, { links: false, images: false })).toBe(markdown);
    }
  });
});

describe("underscore run lengths", () => {
  it("should treat a run of four as balanced", () => {
    expect(remend("a ____ b")).toBe("a ____ b");
  });

  it("should not complete a thematic break line", () => {
    expect(remend("text\n\n___\n")).toBe("text\n\n___\n");
  });

  it("should keep ___text___ balanced", () => {
    expect(remend("___both___ done")).toBe("___both___ done");
  });
});

describe("escaped underscores", () => {
  it("should treat the run after an escaped underscore as a delimiter", () => {
    expect(remend("\\___bold")).toBe("\\___bold__");
  });
});
