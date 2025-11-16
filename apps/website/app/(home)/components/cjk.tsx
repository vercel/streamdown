import { Section } from "./section";

const markdown = `# CJK Language Support

Streamdown properly handles emphasis in Chinese, Japanese, and Korean text, even with ideographic punctuation.

## Japanese

Standard markdown breaks with ideographic punctuation:

**この文は太字になります（This sentence will be bolded）。**

*斜体のテキスト【補足情報】*

~~削除されたテキスト（古い情報）~~

## Chinese

Works seamlessly with Chinese punctuation:

**重要提示（Important Notice）：请注意。**

*这是斜体文字（带括号）。*

~~旧方法（已废弃）~~ → 新方法

## Korean

Korean text with mixed punctuation:

**한국어 텍스트（괄호 포함）。**

*기울임 텍스트【주석】*
`;

export const CJKLanguageSupport = () => (
  <Section
    description="Built-in support for Chinese, Japanese, and Korean languages ensures emphasis markers work correctly with ideographic punctuation—critical for AI-generated content."
    markdown={markdown}
    title="CJK Language Support"
  />
);
