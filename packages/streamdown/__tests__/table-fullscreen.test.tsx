import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

const markdownWithTable = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;

describe("TableFullscreenButton", () => {
  it("should render fullscreen button when controls are enabled", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeTruthy();
  });

  it("should not render fullscreen button when controls are false", () => {
    const { container } = render(
      <Streamdown controls={false}>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should not render fullscreen button when table fullscreen is false", () => {
    const { container } = render(
      <Streamdown controls={{ table: { fullscreen: false } }}>
        {markdownWithTable}
      </Streamdown>
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should open fullscreen overlay on click", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();
  });

  it("should close fullscreen overlay on close button click", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]'
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    fireEvent.click(closeBtn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeFalsy();
  });

  it("should close fullscreen overlay on Escape key", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeFalsy();
  });

  it("should lock body scroll when fullscreen is open", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    expect(document.body.style.overflow).toBe("hidden");

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(closeBtn);

    expect(document.body.style.overflow).toBe("");
  });

  it("should disable fullscreen button when isAnimating", () => {
    const { container } = render(
      <Streamdown isAnimating={true}>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it("should render table content inside fullscreen overlay", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const table = overlay?.querySelector('[data-streamdown="table"]');
    expect(table).toBeTruthy();
  });

  it("should show copy and download controls in fullscreen", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    const downloadBtn = overlay?.querySelector(
      'button[title="Download table"]'
    );
    expect(copyBtn).toBeTruthy();
    expect(downloadBtn).toBeTruthy();
  });

  it("should not close fullscreen when clicking controls inside overlay", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();

    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]'
    ) as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();
    fireEvent.click(copyBtn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
  });

  it("should not close fullscreen when clicking table content", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const table = overlay?.querySelector(
      '[data-streamdown="table"]'
    ) as HTMLTableElement;
    expect(table).toBeTruthy();
    fireEvent.click(table);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
  });

  it("should close fullscreen overlay on backdrop click", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();

    if (overlay) {
      fireEvent.click(overlay);
    }

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeFalsy();
  });

  it("should have aria attributes on fullscreen overlay", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay?.getAttribute("role")).toBe("dialog");
    expect(overlay?.getAttribute("aria-modal")).toBe("true");
    expect(overlay?.getAttribute("aria-label")).toBeTruthy();
  });

  it("should close fullscreen on Escape keyDown on the dialog element itself", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();

    // Fire keyDown directly on the dialog element (covers onKeyDown handler lines 80-83)
    if (overlay) {
      fireEvent.keyDown(overlay, { key: "Escape" });
    }

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeFalsy();
  });

  it("should not close fullscreen on keyDown inside inner presentation div", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();

    // Fire keyDown on the inner presentation div (covers line 91 stopPropagation)
    const innerDiv = overlay?.querySelector('[role="presentation"]');
    expect(innerDiv).toBeTruthy();
    if (innerDiv) {
      fireEvent.keyDown(innerDiv, { key: "Escape" });
    }

    // Should still be open because stopPropagation prevents it from reaching the dialog
    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
  });

  it("should hide copy in fullscreen when table copy is false", () => {
    const { container } = render(
      <Streamdown controls={{ table: { copy: false } }}>
        {markdownWithTable}
      </Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    expect(copyBtn).toBeFalsy();
  });

  it('should have data-streamdown="table-wrapper" inside fullscreen overlay so copy/download can find the table', () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    // The inner wrapper must have data-streamdown="table-wrapper" so that
    // TableCopyDropdown and TableDownloadDropdown can call .closest() to find the table
    const tableWrapper = overlay?.querySelector(
      '[data-streamdown="table-wrapper"]'
    );
    expect(tableWrapper).toBeTruthy();

    // And the actual table must be queryable from within the wrapper
    const table = tableWrapper?.querySelector('[data-streamdown="table"]');
    expect(table).toBeTruthy();
  });

  it("should show copy format options in fullscreen", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]'
    ) as HTMLButtonElement;
    fireEvent.click(copyBtn);

    expect(
      overlay?.querySelector('button[title="Copy table as CSV"]')
    ).toBeTruthy();
    expect(
      overlay?.querySelector('button[title="Copy table as Markdown"]')
    ).toBeTruthy();
    expect(
      overlay?.querySelector('button[title="Copy table as TSV"]')
    ).toBeTruthy();
  });

  it("should show download format options in fullscreen", () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const downloadBtn = overlay?.querySelector(
      'button[title="Download table"]'
    ) as HTMLButtonElement;
    fireEvent.click(downloadBtn);

    expect(
      overlay?.querySelector('button[title="Download table as CSV"]')
    ).toBeTruthy();
    expect(
      overlay?.querySelector('button[title="Download table as Markdown"]')
    ).toBeTruthy();
  });

  it("should portal fullscreen overlay to the configured portal target", () => {
    const portalRoot = document.createElement("div");
    document.body.appendChild(portalRoot);

    const { container, unmount } = render(
      <Streamdown portal={portalRoot}>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    expect(
      portalRoot.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();

    unmount();
    portalRoot.remove();
  });
});

describe("TableFullscreenButton copy and download", () => {
  const originalClipboard = navigator.clipboard;
  const originalClipboardItem = globalThis.ClipboardItem;

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockResolvedValue(undefined),
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
    if (!globalThis.ClipboardItem) {
      globalThis.ClipboardItem = class {
        types: string[];
        data: Record<string, Blob>;
        constructor(data: Record<string, Blob>) {
          this.types = Object.keys(data);
          this.data = data;
        }
      } as any;
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(navigator, "clipboard", {
      value: originalClipboard,
      writable: true,
      configurable: true,
    });
    if (originalClipboardItem) {
      globalThis.ClipboardItem = originalClipboardItem;
    }
  });

  it("should copy table as CSV in fullscreen", async () => {
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]'
    ) as HTMLButtonElement;
    fireEvent.click(copyBtn);

    const csvBtn = overlay?.querySelector(
      'button[title="Copy table as CSV"]'
    ) as HTMLButtonElement;
    // biome-ignore lint/suspicious/useAwait: act needs async to flush clipboard promises
    await act(async () => {
      fireEvent.click(csvBtn);
    });

    expect(navigator.clipboard.write).toHaveBeenCalled();
  });

  it("should download table as CSV in fullscreen", async () => {
    const { save } = await import("../lib/utils");
    const { container } = render(<Streamdown>{markdownWithTable}</Streamdown>);

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const downloadBtn = overlay?.querySelector(
      'button[title="Download table"]'
    ) as HTMLButtonElement;
    fireEvent.click(downloadBtn);

    const csvBtn = overlay?.querySelector(
      'button[title="Download table as CSV"]'
    ) as HTMLButtonElement;
    fireEvent.click(csvBtn);

    expect(save).toHaveBeenCalledWith(
      "table.csv",
      expect.any(String),
      "text/csv"
    );
  });
});
