import { marked } from 'marked';

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  const tokens = marked.lexer(markdown);
  return tokens.map((token) => token.raw);
};
