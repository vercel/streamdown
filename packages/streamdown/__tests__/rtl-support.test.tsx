import { render } from '@testing-library/react';
import { Streamdown } from '../index';

describe('RTL (Right-to-Left) Support', () => {
  it('renders basic RTL text correctly', () => {
    const rtlContent = 'مرحبا بك في Streamdown';
    const { container } = render(<Streamdown>{rtlContent}</Streamdown>);

    expect(container.textContent).toContain('مرحبا بك في Streamdown');
  });

  it('renders mixed RTL/LTR content in paragraphs', () => {
    const mixedContent = `
This is English text.

هذا نص عربي مع **تنسيق غامق** و *مائل*.

Mixed paragraph: Hello مرحبا World عالم.
    `;

    const { container } = render(<Streamdown>{mixedContent}</Streamdown>);
    expect(container.textContent).toContain('هذا نص عربي');
    expect(container.textContent).toContain('Hello مرحبا World عالم');
  });

  it('renders RTL content in lists', () => {
    const rtlList = `
- عنصر القائمة الأول
- עברית פריט רשימה
- Third item in English
- רابع عنصر بالعربية
    `;

    const { container } = render(<Streamdown>{rtlList}</Streamdown>);
    const listItems = container.querySelectorAll(
      '[data-streamdown="list-item"]'
    );
    expect(listItems.length).toBe(4);
    expect(container.textContent).toContain('עברית פריט רשימה');
  });

  it('renders RTL content in headings', () => {
    const rtlHeadings = `
# عنوان رئيسي بالعربية

## כותרת משנה בעברית

### Mixed Heading مختلط
    `;

    const { container } = render(<Streamdown>{rtlHeadings}</Streamdown>);
    const h1 = container.querySelector('[data-streamdown="heading-1"]');
    const h2 = container.querySelector('[data-streamdown="heading-2"]');
    const h3 = container.querySelector('[data-streamdown="heading-3"]');

    expect(h1?.textContent).toBe('عنوان رئيسي بالعربية');
    expect(h2?.textContent).toBe('כותרת משנה בעברית');
    expect(h3?.textContent).toBe('Mixed Heading مختلط');
  });

  it('renders RTL content in tables', () => {
    const rtlTable = `
| English | عربي | עברית |
|---------|------|-------|
| Hello | مرحبا | שלום |
| World | عالم | עולם |
    `;

    const { container } = render(<Streamdown>{rtlTable}</Streamdown>);
    const cells = container.querySelectorAll('[data-streamdown="table-cell"]');

    expect(cells[0]?.textContent).toBe('Hello');
    expect(cells[1]?.textContent).toBe('مرحبا');
    expect(cells[2]?.textContent).toBe('שלום');
  });

  it('renders RTL content in blockquotes', () => {
    const rtlQuote = `
> هذا اقتباس بالعربية مع **تنسيق**.
> 
> זה ציטוט בעברית.
    `;

    const { container } = render(<Streamdown>{rtlQuote}</Streamdown>);
    const blockquote = container.querySelector(
      '[data-streamdown="blockquote"]'
    );

    expect(blockquote?.textContent).toContain('هذا اقتباس بالعربية');
    expect(blockquote?.textContent).toContain('זה ציטוט בעברית');
  });

  it('renders inline code with RTL text', () => {
    const inlineRtl = 'Use `مرحبا` for greeting in Arabic';

    const { container } = render(<Streamdown>{inlineRtl}</Streamdown>);
    const inlineCode = container.querySelector(
      '[data-streamdown="inline-code"]'
    );

    expect(inlineCode?.textContent).toBe('مرحبا');
  });

  it('renders links with RTL text', () => {
    const rtlLink = '[نص الرابط العربي](https://example.com)';

    const { container } = render(<Streamdown>{rtlLink}</Streamdown>);
    const link = container.querySelector('[data-streamdown="link"]');

    expect(link?.textContent).toBe('نص الرابط العربي');
    expect(link?.getAttribute('href')).toBe('https://example.com/');
  });

  it('works with dir="rtl" CSS style', () => {
    const rtlContent = 'هذا نص عربي كامل';

    const { container } = render(
      <div dir="rtl">
        <Streamdown>{rtlContent}</Streamdown>
      </div>
    );

    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.getAttribute('dir')).toBe('rtl');
    expect(container.textContent).toContain('هذا نص عربي كامل');
  });

  it('preserves bidirectional text ordering', () => {
    const bidiContent = 'The price is 50 ريال for the العربية edition';

    const { container } = render(<Streamdown>{bidiContent}</Streamdown>);
    expect(container.textContent).toBe(
      'The price is 50 ريال for the العربية edition'
    );
  });
});
