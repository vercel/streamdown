import { act, fireEvent, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { TableCopyDropdown } from "../lib/table/copy-dropdown";
import {
  TableDownloadButton,
  TableDownloadDropdown,
} from "../lib/table/download-dropdown";

vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

const renderInTableWrapper = (ui: React.ReactElement) => {
  return render(
    <StreamdownContext.Provider
      value={{
        shikiTheme: ["github-light", "github-dark"],
        controls: true,
        isAnimating: false,
        mode: "streaming",
      }}
    >
      <div data-streamdown="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Alice</td>
              <td>30</td>
            </tr>
          </tbody>
        </table>
        {ui}
      </div>
    </StreamdownContext.Provider>
  );
};

describe("TableDownloadDropdown", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should download as CSV when CSV button clicked", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();

    const { container } = renderInTableWrapper(
      <TableDownloadDropdown onDownload={onDownload} />
    );

    // Open dropdown
    const toggleBtn = container.querySelector('button[title="Download table"]');
    expect(toggleBtn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    // Click CSV option
    const csvBtn = container.querySelector(
      'button[title="Download table as CSV"]'
    );
    expect(csvBtn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(csvBtn!);

    expect(save).toHaveBeenCalledWith(
      "table.csv",
      expect.any(String),
      "text/csv"
    );
    expect(onDownload).toHaveBeenCalledWith("csv");
  });

  it("should download as Markdown when Markdown button clicked", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();

    const { container } = renderInTableWrapper(
      <TableDownloadDropdown onDownload={onDownload} />
    );

    // Open dropdown
    const toggleBtn = container.querySelector('button[title="Download table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    // Click Markdown option
    const mdBtn = container.querySelector(
      'button[title="Download table as Markdown"]'
    );
    expect(mdBtn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(mdBtn!);

    expect(save).toHaveBeenCalledWith(
      "table.md",
      expect.any(String),
      "text/markdown"
    );
    expect(onDownload).toHaveBeenCalledWith("markdown");
  });

  it("should call onError when save throws", async () => {
    const { save } = await import("../lib/utils");
    (save as any).mockImplementation(() => {
      throw new Error("Save error");
    });

    const onError = vi.fn();
    const { container } = renderInTableWrapper(
      <TableDownloadDropdown onError={onError} />
    );

    const toggleBtn = container.querySelector('button[title="Download table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const csvBtn = container.querySelector(
      'button[title="Download table as CSV"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(csvBtn!);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should close dropdown on outside click", () => {
    const { container } = renderInTableWrapper(<TableDownloadDropdown />);

    // Open dropdown
    const toggleBtn = container.querySelector('button[title="Download table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    // Verify dropdown is open
    expect(
      container.querySelector('button[title="Download table as CSV"]')
    ).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(document.body);

    // Dropdown should close
    expect(
      container.querySelector('button[title="Download table as CSV"]')
    ).toBeFalsy();
  });

  it("should call onError when no table found", () => {
    const onError = vi.fn();
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <TableDownloadDropdown onError={onError} />
      </StreamdownContext.Provider>
    );

    const toggleBtn = container.querySelector('button[title="Download table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const csvBtn = container.querySelector(
      'button[title="Download table as CSV"]'
    );
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(csvBtn!);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("TableDownloadButton with format='markdown'", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should download as markdown format", () => {
    const onDownload = vi.fn();
    const { container } = renderInTableWrapper(
      <TableDownloadButton format="markdown" onDownload={onDownload} />
    );

    const btn = container.querySelector(
      'button[title="Download table as MARKDOWN"]'
    );
    expect(btn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(btn!);

    expect(onDownload).toHaveBeenCalled();
  });

  it("should handle default format (fallback to csv)", () => {
    const { container } = renderInTableWrapper(
      <TableDownloadButton format={"unknown" as any} />
    );

    const btn = container.querySelector("button[title]");
    expect(btn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(btn!);
  });

  it("should call onError when table not found", () => {
    const onError = vi.fn();
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <TableDownloadButton onError={onError} />
      </StreamdownContext.Provider>
    );

    const btn = container.querySelector("button");
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(btn!);

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});

describe("TableCopyDropdown", () => {
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
    // Mock ClipboardItem if not present
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

  it("should copy as Markdown when md button clicked", async () => {
    const onCopy = vi.fn();
    const { container } = renderInTableWrapper(
      <TableCopyDropdown onCopy={onCopy} />
    );

    // Open dropdown
    const toggleBtn = container.querySelector('button[title="Copy table"]');
    expect(toggleBtn).toBeTruthy();
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    // Click Markdown option (line 114)
    const mdBtn = container.querySelector(
      'button[title="Copy table as Markdown"]'
    );
    expect(mdBtn).toBeTruthy();

    // biome-ignore lint/suspicious/useAwait: act needs async to flush clipboard promises
    await act(async () => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(mdBtn!);
    });

    expect(navigator.clipboard.write).toHaveBeenCalled();
    expect(onCopy).toHaveBeenCalledWith("md");
  });

  it("should copy as CSV when csv button clicked", async () => {
    const onCopy = vi.fn();
    const { container } = renderInTableWrapper(
      <TableCopyDropdown onCopy={onCopy} />
    );

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const csvBtn = container.querySelector('button[title="Copy table as CSV"]');
    // biome-ignore lint/suspicious/useAwait: act needs async to flush clipboard promises
    await act(async () => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(csvBtn!);
    });

    expect(onCopy).toHaveBeenCalledWith("csv");
  });

  it("should copy as TSV when tsv button clicked", async () => {
    const onCopy = vi.fn();
    const { container } = renderInTableWrapper(
      <TableCopyDropdown onCopy={onCopy} />
    );

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const tsvBtn = container.querySelector('button[title="Copy table as TSV"]');
    // biome-ignore lint/suspicious/useAwait: act needs async to flush clipboard promises
    await act(async () => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(tsvBtn!);
    });

    expect(onCopy).toHaveBeenCalledWith("tsv");
  });

  it("should call onError when clipboard API not available", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {},
      writable: true,
      configurable: true,
    });

    const onError = vi.fn();
    const { container } = renderInTableWrapper(
      <TableCopyDropdown onError={onError} />
    );

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const mdBtn = container.querySelector(
      'button[title="Copy table as Markdown"]'
    );
    await act(() => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(mdBtn!);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should call onError when table not found", async () => {
    const onError = vi.fn();
    const { container } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <TableCopyDropdown onError={onError} />
      </StreamdownContext.Provider>
    );

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const mdBtn = container.querySelector(
      'button[title="Copy table as Markdown"]'
    );
    await act(() => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(mdBtn!);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });

  it("should close dropdown on outside click", () => {
    const { container } = renderInTableWrapper(<TableCopyDropdown />);

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    expect(
      container.querySelector('button[title="Copy table as Markdown"]')
    ).toBeTruthy();

    fireEvent.mouseDown(document.body);

    expect(
      container.querySelector('button[title="Copy table as Markdown"]')
    ).toBeFalsy();
  });

  it("should call onError when clipboard write fails", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: {
        write: vi.fn().mockRejectedValue(new Error("Write failed")),
      },
      writable: true,
      configurable: true,
    });

    const onError = vi.fn();
    const { container } = renderInTableWrapper(
      <TableCopyDropdown onError={onError} />
    );

    const toggleBtn = container.querySelector('button[title="Copy table"]');
    // biome-ignore lint/style/noNonNullAssertion: test assertion
    fireEvent.click(toggleBtn!);

    const mdBtn = container.querySelector(
      'button[title="Copy table as Markdown"]'
    );
    await act(() => {
      // biome-ignore lint/style/noNonNullAssertion: test assertion
      fireEvent.click(mdBtn!);
    });

    expect(onError).toHaveBeenCalledWith(expect.any(Error));
  });
});
