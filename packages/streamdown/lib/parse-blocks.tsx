import { marked } from 'marked';

export const parseMarkdownIntoBlocks = (markdown: string): string[] => {
  const tokens = marked.use({ gfm: true }).lexer(markdown);
  const blocks = tokens.map((token) => token.raw);
  
  // Post-process to merge consecutive blocks that are part of the same math block
  const mergedBlocks: string[] = [];
  
  for (let i = 0; i < blocks.length; i++) {
    const currentBlock = blocks[i];
    
    // Check if this is a standalone $$ that might be a closing delimiter
    if (currentBlock.trim() === '$$' && mergedBlocks.length > 0) {
      const previousBlock = mergedBlocks[mergedBlocks.length - 1];
      
      // Check if the previous block starts with $$ but doesn't end with $$
      const prevStartsWith$$ = previousBlock.trimStart().startsWith('$$');
      const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;
      
      // If previous block has odd number of $$ and starts with $$, merge them
      if (prevStartsWith$$ && prevDollarCount % 2 === 1) {
        mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
        continue;
      }
    }
    
    // Check if current block ends with $$ and previous block started with $$ but didn't close
    if (mergedBlocks.length > 0 && currentBlock.trimEnd().endsWith('$$')) {
      const previousBlock = mergedBlocks[mergedBlocks.length - 1];
      const prevStartsWith$$ = previousBlock.trimStart().startsWith('$$');
      const prevDollarCount = (previousBlock.match(/\$\$/g) || []).length;
      const currDollarCount = (currentBlock.match(/\$\$/g) || []).length;
      
      // If previous block has unclosed math (odd $$) and current block ends with $$
      // AND current block doesn't start with $$, it's likely a continuation
      if (prevStartsWith$$ && prevDollarCount % 2 === 1 && 
          !currentBlock.trimStart().startsWith('$$') && currDollarCount === 1) {
        mergedBlocks[mergedBlocks.length - 1] = previousBlock + currentBlock;
        continue;
      }
    }
    
    mergedBlocks.push(currentBlock);
  }
  
  return mergedBlocks;
};
