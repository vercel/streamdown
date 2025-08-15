import { type HTMLAttributes, useEffect, useState } from 'react';
import { type BundledLanguage, codeToHtml } from 'shiki';

type CodeBlockProps = HTMLAttributes<HTMLDivElement> & {
  code: string;
  language: BundledLanguage;
};

export async function highlightCode(code: string, language: BundledLanguage) {
  return await codeToHtml(code, {
    lang: language,
    theme: 'github-light',
  });
}

export const CodeBlock = ({ code, language, ...props }: CodeBlockProps) => {
  const [html, setHtml] = useState<string>('');

  useEffect(() => {
    highlightCode(code, language).then(setHtml);
  }, [code, language]);

  // biome-ignore lint/security/noDangerouslySetInnerHtml: "we need this."
  return <div dangerouslySetInnerHTML={{ __html: html }} {...props} />;
};
