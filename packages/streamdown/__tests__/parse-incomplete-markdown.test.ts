import { describe, expect, it } from 'vitest';
import { parseIncompleteMarkdown } from '../lib/parse-incomplete-markdown';

describe('parseIncompleteMarkdown', () => {
  describe('basic input handling', () => {
    it('should return non-string inputs unchanged', () => {
      expect(parseIncompleteMarkdown(null as any)).toBe(null);
      expect(parseIncompleteMarkdown(undefined as any)).toBe(undefined);
      expect(parseIncompleteMarkdown(123 as any)).toBe(123);
    });

    it('should return empty string unchanged', () => {
      expect(parseIncompleteMarkdown('')).toBe('');
    });

    it('should return regular text unchanged', () => {
      const text = 'This is plain text without any markdown';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe('link handling', () => {
    it('should remove incomplete links', () => {
      expect(parseIncompleteMarkdown('Text with [incomplete link')).toBe(
        'Text with '
      );
      expect(parseIncompleteMarkdown('Text [partial')).toBe('Text ');
    });

    it('should keep complete links unchanged', () => {
      const text = 'Text with [complete link](url)';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple complete links', () => {
      const text = '[link1](url1) and [link2](url2)';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe('image handling', () => {
    it('should remove incomplete images', () => {
      expect(parseIncompleteMarkdown('Text with ![incomplete image')).toBe(
        'Text with '
      );
      expect(parseIncompleteMarkdown('![partial')).toBe('');
    });

    it('should keep complete images unchanged', () => {
      const text = 'Text with ![alt text](image.png)';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe('bold formatting (**)', () => {
    it('should complete incomplete bold formatting', () => {
      expect(parseIncompleteMarkdown('Text with **bold')).toBe(
        'Text with **bold**'
      );
      expect(parseIncompleteMarkdown('**incomplete')).toBe('**incomplete**');
    });

    it('should keep complete bold formatting unchanged', () => {
      const text = 'Text with **bold text**';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple bold sections', () => {
      const text = '**bold1** and **bold2**';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should complete odd number of bold markers', () => {
      expect(parseIncompleteMarkdown('**first** and **second')).toBe(
        '**first** and **second**'
      );
    });
  });

  describe('italic formatting with underscores (__)', () => {
    it('should complete incomplete italic formatting with double underscores', () => {
      expect(parseIncompleteMarkdown('Text with __italic')).toBe(
        'Text with __italic__'
      );
      expect(parseIncompleteMarkdown('__incomplete')).toBe('__incomplete__');
    });

    it('should keep complete italic formatting unchanged', () => {
      const text = 'Text with __italic text__';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle odd number of double underscore pairs', () => {
      expect(parseIncompleteMarkdown('__first__ and __second')).toBe(
        '__first__ and __second__'
      );
    });
  });

  describe('italic formatting with asterisks (*)', () => {
    it('should complete incomplete italic formatting with single asterisks', () => {
      expect(parseIncompleteMarkdown('Text with *italic')).toBe(
        'Text with *italic*'
      );
      expect(parseIncompleteMarkdown('*incomplete')).toBe('*incomplete*');
    });

    it('should keep complete italic formatting unchanged', () => {
      const text = 'Text with *italic text*';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should not confuse single asterisks with bold markers', () => {
      expect(parseIncompleteMarkdown('**bold** and *italic')).toBe(
        '**bold** and *italic*'
      );
    });
  });

  describe('italic formatting with single underscores (_)', () => {
    it('should complete incomplete italic formatting with single underscores', () => {
      expect(parseIncompleteMarkdown('Text with _italic')).toBe(
        'Text with _italic_'
      );
      expect(parseIncompleteMarkdown('_incomplete')).toBe('_incomplete_');
    });

    it('should keep complete italic formatting unchanged', () => {
      const text = 'Text with _italic text_';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should not confuse single underscores with double underscore markers', () => {
      expect(parseIncompleteMarkdown('__bold__ and _italic')).toBe(
        '__bold__ and _italic_'
      );
    });

    it('should handle escaped single underscores', () => {
      const text = 'Text with \\_escaped underscore';
      expect(parseIncompleteMarkdown(text)).toBe(text);
      
      const text2 = 'some\\_text_with_underscores';
      expect(parseIncompleteMarkdown(text2)).toBe('some\\_text_with_underscores');
    });
  });

  describe('inline code formatting (`)', () => {
    it('should complete incomplete inline code', () => {
      expect(parseIncompleteMarkdown('Text with `code')).toBe(
        'Text with `code`'
      );
      expect(parseIncompleteMarkdown('`incomplete')).toBe('`incomplete`');
    });

    it('should keep complete inline code unchanged', () => {
      const text = 'Text with `inline code`';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple inline code sections', () => {
      const text = '`code1` and `code2`';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should not complete backticks inside code blocks', () => {
      const text = '```\ncode block with `backtick\n```';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle incomplete code blocks correctly', () => {
      const text = '```javascript\nconst x = `template';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle inline triple backticks correctly', () => {
      const text = '```python print("Hello, Sunnyvale!")```';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle incomplete inline triple backticks', () => {
      const text = '```python print("Hello, Sunnyvale!")``';
      expect(parseIncompleteMarkdown(text)).toBe('```python print("Hello, Sunnyvale!")```');
    });
  });

  describe('strikethrough formatting (~~)', () => {
    it('should complete incomplete strikethrough', () => {
      expect(parseIncompleteMarkdown('Text with ~~strike')).toBe(
        'Text with ~~strike~~'
      );
      expect(parseIncompleteMarkdown('~~incomplete')).toBe('~~incomplete~~');
    });

    it('should keep complete strikethrough unchanged', () => {
      const text = 'Text with ~~strikethrough text~~';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple strikethrough sections', () => {
      const text = '~~strike1~~ and ~~strike2~~';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should complete odd number of strikethrough markers', () => {
      expect(parseIncompleteMarkdown('~~first~~ and ~~second')).toBe(
        '~~first~~ and ~~second~~'
      );
    });
  });

  describe('mixed formatting', () => {
    it('should handle multiple formatting types', () => {
      const text = '**bold** and *italic* and `code` and ~~strike~~';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should complete multiple incomplete formats', () => {
      expect(parseIncompleteMarkdown('**bold and *italic')).toBe(
        '**bold and *italic*'
      );
    });

    it('should handle nested formatting', () => {
      const text = '**bold with *italic* inside**';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should prioritize link/image removal over formatting completion', () => {
      expect(parseIncompleteMarkdown('Text with [link and **bold')).toBe(
        'Text with '
      );
    });

    it('should handle complex real-world markdown', () => {
      const text =
        '# Heading\n\n**Bold text** with *italic* and `code`.\n\n- List item\n- Another item with ~~strike~~';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });

  describe('KaTeX block formatting ($$)', () => {
    it('should complete incomplete block KaTeX', () => {
      expect(parseIncompleteMarkdown('Text with $$formula')).toBe(
        'Text with $$formula$$'
      );
      expect(parseIncompleteMarkdown('$$incomplete')).toBe('$$incomplete$$');
    });

    it('should keep complete block KaTeX unchanged', () => {
      const text = 'Text with $$E = mc^2$$';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple block KaTeX sections', () => {
      const text = '$$formula1$$ and $$formula2$$';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should complete odd number of block KaTeX markers', () => {
      expect(parseIncompleteMarkdown('$$first$$ and $$second')).toBe(
        '$$first$$ and $$second$$'
      );
    });

    it('should handle block KaTeX at start of text', () => {
      expect(parseIncompleteMarkdown('$$x + y = z')).toBe('$$x + y = z$$');
    });

    it('should handle multiline block KaTeX', () => {
      expect(parseIncompleteMarkdown('$$\nx = 1\ny = 2')).toBe(
        '$$\nx = 1\ny = 2$$'
      );
    });
  });

  describe('KaTeX inline formatting ($)', () => {
    it('should complete incomplete inline KaTeX', () => {
      expect(parseIncompleteMarkdown('Text with $formula')).toBe(
        'Text with $formula$'
      );
      expect(parseIncompleteMarkdown('$incomplete')).toBe('$incomplete$');
    });

    it('should keep complete inline KaTeX unchanged', () => {
      const text = 'Text with $x^2 + y^2 = z^2$';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple inline KaTeX sections', () => {
      const text = '$a = 1$ and $b = 2$';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should complete odd number of inline KaTeX markers', () => {
      expect(parseIncompleteMarkdown('$first$ and $second')).toBe(
        '$first$ and $second$'
      );
    });

    it('should not confuse single $ with block $$', () => {
      expect(parseIncompleteMarkdown('$$block$$ and $inline')).toBe(
        '$$block$$ and $inline$'
      );
    });

    it('should handle inline KaTeX at start of text', () => {
      expect(parseIncompleteMarkdown('$x + y = z')).toBe('$x + y = z$');
    });

    it('should handle escaped dollar signs', () => {
      const text = 'Price is \\$100';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });

    it('should handle multiple consecutive dollar signs correctly', () => {
      expect(parseIncompleteMarkdown('$$$')).toBe('$$$$$');
      expect(parseIncompleteMarkdown('$$$$')).toBe('$$$$');
    });
  });

  describe('edge cases', () => {
    it('should handle text ending with formatting characters', () => {
      expect(parseIncompleteMarkdown('Text ending with *')).toBe(
        'Text ending with **'
      );
      expect(parseIncompleteMarkdown('Text ending with **')).toBe(
        'Text ending with ****'
      );
    });

    it('should handle empty formatting markers', () => {
      expect(parseIncompleteMarkdown('****')).toBe('****');
      expect(parseIncompleteMarkdown('``')).toBe('``');
    });

    it('should handle very long text', () => {
      const longText = 'a'.repeat(10_000) + ' **bold';
      const expected = 'a'.repeat(10_000) + ' **bold**';
      expect(parseIncompleteMarkdown(longText)).toBe(expected);
    });

    it('should handle text with only formatting characters', () => {
      expect(parseIncompleteMarkdown('*')).toBe('**');
      expect(parseIncompleteMarkdown('**')).toBe('****');
      expect(parseIncompleteMarkdown('`')).toBe('``');
    });

    it('should handle escaped characters', () => {
      const text = 'Text with \\* escaped asterisk';
      expect(parseIncompleteMarkdown(text)).toBe(text);
    });
  });
});
