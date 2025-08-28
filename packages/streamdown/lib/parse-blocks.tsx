import { marked } from 'marked';

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  const tokens = marked.use({ gfm: true }).lexer(markdown);
  return tokens.map((token) => token.raw);
};
