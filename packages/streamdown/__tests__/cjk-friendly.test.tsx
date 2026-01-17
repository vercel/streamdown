import { cjk } from "@streamdown/cjk";
import { render } from "@testing-library/react";
import remarkGfm from "remark-gfm";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("CJK (Chinese, Japanese, Korean) Friendly Support (#185)", () => {
  describe("Japanese text with emphasis", () => {
    it("renders bold text with Japanese parentheses correctly", () => {
      const japaneseContent =
        "**この文は太字になります（This sentence will be bolded）。**この文が後に続いても大丈夫です（This sentence can be followed without issue）。";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{japaneseContent}</Streamdown>
      );

      // The content should be rendered and processed
      expect(container.textContent).toContain("この文は太字になります");
      expect(container.textContent).toContain("This sentence will be bolded");

      expect(container.textContent).not.toContain("**");
    });

    it("renders bold text with ideographic punctuation marks", () => {
      const punctuationTests = [
        "**日本語の文章（括弧付き）**続き",
        "**テキスト【角括弧】**続き",
        "**文章「引用符」**続き",
        "**内容〈山括弧〉**続き",
      ];

      for (const content of punctuationTests) {
        const { container } = render(
          <Streamdown plugins={{ cjk }}>{content}</Streamdown>
        );
        expect(container.textContent).toBeTruthy();
        expect(container.textContent).not.toContain("**");
      }
    });

    it("renders italic text with Japanese punctuation", () => {
      const japaneseItalic =
        "*これは斜体のテキストです（括弧付き）。*この文が後に続いても大丈夫です。";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{japaneseItalic}</Streamdown>
      );

      expect(container.textContent).toContain("これは斜体のテキストです");
      expect(container.textContent).toContain("括弧付き");

      expect(container.textContent).not.toContain("*");
    });

    it("renders combined bold and italic with Japanese text", () => {
      const combined = "***重要な情報（詳細）***続き";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{combined}</Streamdown>
      );

      expect(container.textContent).toContain("重要な情報");
      expect(container.textContent).toContain("詳細");
      expect(container.textContent).not.toContain("*");
    });

    it("handles complex Japanese markdown", () => {
      const complexContent = `
# 見出し（タイトル）

**太字のテキスト（説明）。**補足のテキスト。

*斜体のテキスト【補足】。*補足のテキスト。

普通のテキストと**太字（強調）**を混ぜる。
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{complexContent}</Streamdown>
      );
      expect(container.textContent).toContain("見出し");
      expect(container.textContent).toContain("太字のテキスト");
      expect(container.textContent).toContain("斜体のテキスト");
      expect(container.textContent).toContain("補足のテキスト");

      expect(container.textContent).not.toContain("*");
    });
  });

  describe("Chinese text with emphasis", () => {
    it("renders bold text with Chinese parentheses correctly", () => {
      const chineseContent = "**这是粗体文字（带括号）。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{chineseContent}</Streamdown>
      );

      expect(container.textContent).toContain("这是粗体文字");
      expect(container.textContent).toContain("带括号");
    });

    it("renders bold text with various Chinese punctuation", () => {
      const punctuationTests = [
        "**中文文本（圆括号）**",
        "**内容【方括号】**",
        "**文字「引号」**",
        "**文本〈书名号〉**",
        "**句子，逗号。**",
        "**问题？**",
        "**感叹！**",
      ];

      for (const content of punctuationTests) {
        const { container } = render(
          <Streamdown plugins={{ cjk }}>{content}</Streamdown>
        );
        expect(container.textContent).toBeTruthy();
      }
    });

    it("renders italic text with Chinese punctuation", () => {
      const chineseItalic = "*这是斜体文字（带括号）。*";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{chineseItalic}</Streamdown>
      );

      expect(container.textContent).toContain("这是斜体文字");
    });

    it("handles mixed Chinese and English with emphasis", () => {
      const mixed = "**重要提示（Important Notice）：请注意。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{mixed}</Streamdown>
      );

      expect(container.textContent).toContain("重要提示");
      expect(container.textContent).toContain("Important Notice");
      expect(container.textContent).toContain("请注意");
    });

    it("handles complex Chinese markdown", () => {
      const complexContent = `
# 标题（主要内容）

**粗体文字（说明）。**

*斜体文字【备注】。*

混合普通文字和**粗体（强调）**内容。
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{complexContent}</Streamdown>
      );
      expect(container.textContent).toContain("标题");
      expect(container.textContent).toContain("粗体文字");
      expect(container.textContent).toContain("斜体文字");
    });
  });

  describe("Korean text with emphasis", () => {
    it("renders bold text with Korean punctuation correctly", () => {
      const koreanContent = "**이것은 굵은 텍스트입니다（괄호 포함）。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{koreanContent}</Streamdown>
      );

      expect(container.textContent).toContain("이것은 굵은 텍스트입니다");
    });

    it("renders italic text with Korean punctuation", () => {
      const koreanItalic = "*기울임 텍스트（괄호 포함）。*";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{koreanItalic}</Streamdown>
      );

      expect(container.textContent).toContain("기울임 텍스트");
    });

    it("handles complex Korean markdown", () => {
      const complexContent = `
# 제목（헤더）

**굵은 글씨（설명）。**

*기울임 글씨【주석】。*
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{complexContent}</Streamdown>
      );
      expect(container.textContent).toContain("제목");
      expect(container.textContent).toContain("굵은 글씨");
    });
  });

  describe("Strikethrough with CJK text", () => {
    it("renders strikethrough text with Japanese punctuation", () => {
      const strikethrough = "~~削除されたテキスト（括弧付き）。~~";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{strikethrough}</Streamdown>
      );

      expect(container.textContent).toContain("削除されたテキスト");
    });

    it("renders strikethrough text with Chinese punctuation", () => {
      const strikethrough = "~~删除的文字（带括号）。~~";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{strikethrough}</Streamdown>
      );

      expect(container.textContent).toContain("删除的文字");
    });

    it("renders strikethrough text with Korean punctuation", () => {
      const strikethrough = "~~취소선 텍스트（괄호）。~~";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{strikethrough}</Streamdown>
      );

      expect(container.textContent).toContain("취소선 텍스트");
    });

    it("handles mixed strikethrough and bold in CJK text", () => {
      const mixed = "**重要な**~~削除された（古い）~~**新しい情報。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{mixed}</Streamdown>
      );

      expect(container.textContent).toContain("重要な");
      expect(container.textContent).toContain("削除された");
      expect(container.textContent).toContain("新しい情報");
    });
  });

  describe("Lists with CJK text and emphasis", () => {
    it("renders unordered lists with CJK emphasis", () => {
      const listContent = `
- **日本語の項目（括弧付き）。**
- **中文项目（带括号）。**
- **한국어 항목（괄호）。**
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{listContent}</Streamdown>
      );
      const listItems = container.querySelectorAll(
        '[data-streamdown="list-item"]'
      );
      expect(listItems.length).toBe(3);
      expect(container.textContent).toContain("日本語の項目");
      expect(container.textContent).toContain("中文项目");
      expect(container.textContent).toContain("한국어 항목");
    });

    it("renders ordered lists with CJK emphasis", () => {
      const listContent = `
1. **第一項目（説明）。**
2. **第二項目【詳細】。**
3. **第三項目「引用」。**
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{listContent}</Streamdown>
      );
      expect(container.textContent).toContain("第一項目");
      expect(container.textContent).toContain("第二項目");
      expect(container.textContent).toContain("第三項目");
    });
  });

  describe("Links and inline code with CJK text", () => {
    it("renders links with CJK emphasis in text", () => {
      const linkContent = "[**日本語のリンク（説明）**](https://example.com)";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{linkContent}</Streamdown>
      );

      const link = container.querySelector('[data-streamdown="link"]');
      expect(link?.textContent).toContain("日本語のリンク");
    });

    it("splits autolinks at CJK punctuation", () => {
      const autolinkContent = "请访问 https://example.com。谢谢";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{autolinkContent}</Streamdown>
      );

      const link = container.querySelector('[data-streamdown="link"]');
      expect(link?.textContent).toBe("https://example.com");
      expect(link?.getAttribute("href")).toBe("https://example.com/");
      expect(container.textContent).toBe(autolinkContent);
    });

    it("keeps default autolink behavior without the CJK boundary plugin", () => {
      const autolinkContent = "请访问 https://example.com。谢谢";
      const { container } = render(
        <Streamdown remarkPlugins={[remarkGfm]}>{autolinkContent}</Streamdown>
      );

      const link = container.querySelector('[data-streamdown="link"]');
      expect(link?.textContent).toBe("https://example.com。谢谢");
      expect(container.textContent).toBe(autolinkContent);
    });

    it("renders inline code near CJK emphasis", () => {
      const inlineContent =
        "**日本語のコード**：`console.log('こんにちは（挨拶）')`";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{inlineContent}</Streamdown>
      );

      expect(container.textContent).toContain("日本語のコード");
      expect(container.textContent).toContain("console.log");
    });
  });

  describe("Tables with CJK text and emphasis", () => {
    it("renders tables with CJK emphasis", () => {
      const tableContent = `
| 日本語 | 中文 | 한국어 |
|--------|------|--------|
| **項目（説明）** | **项目（说明）** | **항목（설명）** |
| *詳細【補足】* | *详细【补充】* | *세부사항【주석】* |
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{tableContent}</Streamdown>
      );
      expect(container.textContent).toContain("項目");
      expect(container.textContent).toContain("项目");
      expect(container.textContent).toContain("항목");
    });
  });

  describe("Blockquotes with CJK text and emphasis", () => {
    it("renders blockquotes with CJK emphasis", () => {
      const quoteContent = `
> **重要な引用（注意）。**
>
> **重要引用（注意）。**
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{quoteContent}</Streamdown>
      );
      const blockquote = container.querySelector(
        '[data-streamdown="blockquote"]'
      );

      expect(blockquote?.textContent).toContain("重要な引用");
      expect(blockquote?.textContent).toContain("重要引用");
    });
  });

  describe("Edge cases and special scenarios", () => {
    it("handles emphasis with only punctuation", () => {
      const punctuationOnly = "**（）【】「」**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{punctuationOnly}</Streamdown>
      );

      expect(container.textContent).toBeTruthy();
    });

    it("handles nested emphasis with CJK punctuation", () => {
      const nested = "**外側（*内側【ネスト】*）。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{nested}</Streamdown>
      );

      expect(container.textContent).toContain("外側");
      expect(container.textContent).toContain("内側");
    });

    it("handles multiple emphasis markers in CJK text", () => {
      const multiple = "**太字（説明）**と*斜体【補足】*と~~削除「古い」~~。";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{multiple}</Streamdown>
      );

      expect(container.textContent).toContain("太字");
      expect(container.textContent).toContain("斜体");
      expect(container.textContent).toContain("削除");
    });

    it("handles emphasis immediately followed by CJK punctuation", () => {
      const immediate = "**テキスト**（説明）";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{immediate}</Streamdown>
      );

      expect(container.textContent).toContain("テキスト");
      expect(container.textContent).toContain("説明");
    });

    it("handles emphasis with mixed LTR and CJK text with punctuation", () => {
      const mixed = "**This is English（これは日本語）mixed content。**";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{mixed}</Streamdown>
      );

      expect(container.textContent).toContain("This is English");
      expect(container.textContent).toContain("これは日本語");
    });

    it("handles incomplete emphasis with CJK punctuation when parseIncompleteMarkdown is enabled", () => {
      const incomplete = "**未完了のテキスト（括弧付き";
      const { container } = render(
        <Streamdown plugins={{ cjk }}>{incomplete}</Streamdown>
      );

      // With parseIncompleteMarkdown enabled (default), should complete the emphasis
      expect(container.textContent).toBeTruthy();
    });

    it("handles streaming scenario with CJK text", () => {
      const streamingContent1 = "**ストリーミング";
      const { container, rerender } = render(
        <Streamdown plugins={{ cjk }}>
          {streamingContent1}
        </Streamdown>
      );

      expect(container.textContent).toBeTruthy();

      // Simulate streaming more content
      const streamingContent2 = "**ストリーミング中（処理中）**";
      rerender(
        <Streamdown plugins={{ cjk }}>
          {streamingContent2}
        </Streamdown>
      );
      expect(container.textContent).toContain("ストリーミング");
      expect(container.textContent).toContain("処理中");
    });
  });

  describe("Real-world LLM output scenarios", () => {
    it("handles typical LLM-generated Japanese response with emphasis", () => {
      const llmContent = `
# 回答（詳細な説明）

**重要なポイント（注意事項）：**

1. **データベースの設定（configuration）。**
2. **APIの認証（authentication）【必須】。**
3. **エラーハンドリング（error handling）「推奨」。**

これらの手順を**慎重に（carefully）**実行してください。
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{llmContent}</Streamdown>
      );
      expect(container.textContent).toContain("回答");
      expect(container.textContent).toContain("重要なポイント");
      expect(container.textContent).toContain("データベースの設定");
      expect(container.textContent).toContain("慎重に");
    });

    it("handles typical LLM-generated Chinese response with emphasis", () => {
      const llmContent = `
# 答案（详细说明）

**重要要点（注意事项）：**

1. **数据库配置（configuration）。**
2. **API认证（authentication）【必需】。**
3. **错误处理（error handling）「推荐」。**

请**仔细（carefully）**执行这些步骤。
      `;

      const { container } = render(
        <Streamdown plugins={{ cjk }}>{llmContent}</Streamdown>
      );
      expect(container.textContent).toContain("答案");
      expect(container.textContent).toContain("重要要点");
      expect(container.textContent).toContain("数据库配置");
      expect(container.textContent).toContain("仔细");
    });
  });
});
