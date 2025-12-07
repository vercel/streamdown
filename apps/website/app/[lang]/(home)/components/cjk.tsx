import { Section } from "./section";

const markdown = `# CJK Language Support

Streamdown properly handles emphasis in Chinese, Japanese, and Korean text, even with ideographic punctuation.

## Japanese

Standard markdown breaks with ideographic punctuation:

**この文は太字になります（This sentence will be bolded）。**この文が後に続いても大丈夫です。

*斜体のテキスト【補足情報】。*この文が後に続いても大丈夫です。

~~削除されたテキスト（古い情報）。~~この文は正しいです。

## Chinese

Works seamlessly with Chinese punctuation:

**重要提示（Important Notice）：**请注意。

*这是斜体文字（带括号）。*这句子继续也没问题。

~~旧方法（已废弃）。~~这个句子是正确的。

## Korean

Korean text with mixed punctuation:

**한국어 구문(괄호 포함)**을 강조.

*이 텍스트(괄호 포함)*는 기울임꼴입니다.

~~이 텍스트(괄호 포함)~~를 삭제합니다.
`;

export const CJKLanguageSupport = () => (
  <Section
    description="Built-in support for Chinese, Japanese, and Korean languages ensures emphasis markers work correctly with ideographic punctuation—critical for AI-generated content."
    markdown={markdown}
    title="CJK Language Support"
  />
);
