import { fireEvent, render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { StreamdownRuntimeContext } from "../index";
import {
  TableDownloadButton,
  TableDownloadDropdown,
} from "../lib/table/download-dropdown";

// Setup global URL mocks before any tests run
if (typeof URL.createObjectURL === "undefined") {
  URL.createObjectURL = vi.fn();
  URL.revokeObjectURL = vi.fn();
}

// Mock the utils
vi.mock("../lib/utils", async () => {
  const actual = await vi.importActual("../lib/utils");
  return {
    ...actual,
    save: vi.fn(),
  };
});

describe("TableDownloadButton", () => {
  let mockTable: HTMLTableElement;
  let mockWrapper: HTMLDivElement;

  beforeEach(() => {
    // Create a mock table structure
    mockTable = document.createElement("table");
    mockTable.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John</td>
          <td>30</td>
        </tr>
      </tbody>
    `;

    mockWrapper = document.createElement("div");
    mockWrapper.setAttribute("data-streamdown", "table-wrapper");
    mockWrapper.appendChild(mockTable);
    document.body.appendChild(mockWrapper);

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(mockWrapper);
  });

  it("should render button with default icon", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button).toBeTruthy();
    expect(button?.getAttribute("title")).toContain("CSV");
  });

  it("should render button with custom children", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton>
          <span>Custom Download</span>
        </TableDownloadButton>
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    expect(container.textContent).toContain("Custom Download");
  });

  it("should be disabled when animating", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: true }}>
        <TableDownloadButton />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("should download CSV by default", () => {
    const onDownload = vi.fn();

    // Mock DOM methods for download
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag) => {
        if (tag === "a") return mockAnchor;
        return originalCreateElement(tag);
      });
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchor);
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    // Create wrapper and render button inside it properly
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-streamdown", "table-wrapper");
    wrapper.appendChild(mockTable.cloneNode(true));
    document.body.appendChild(wrapper);

    const buttonDiv = document.createElement("div");
    wrapper.appendChild(buttonDiv);

    render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton onDownload={onDownload} />
      </StreamdownRuntimeContext.Provider>,
      { container: buttonDiv }
    );

    const button = buttonDiv.querySelector("button");
    fireEvent.click(button!);

    expect(onDownload).toHaveBeenCalled();

    document.body.removeChild(wrapper);
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("should download markdown when format is specified", () => {
    const onDownload = vi.fn();

    // Mock DOM methods for download
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag) => {
        if (tag === "a") return mockAnchor;
        return originalCreateElement(tag);
      });
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchor);
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    // Create wrapper and render button inside it properly
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-streamdown", "table-wrapper");
    wrapper.appendChild(mockTable.cloneNode(true));
    document.body.appendChild(wrapper);

    const buttonDiv = document.createElement("div");
    wrapper.appendChild(buttonDiv);

    render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton format="markdown" onDownload={onDownload} />
      </StreamdownRuntimeContext.Provider>,
      { container: buttonDiv }
    );

    const button = buttonDiv.querySelector("button");
    expect(button?.getAttribute("title")).toContain("MARKDOWN");

    fireEvent.click(button!);

    expect(onDownload).toHaveBeenCalled();

    document.body.removeChild(wrapper);
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("should use custom filename", () => {
    const onDownload = vi.fn();

    // Mock DOM methods for download
    const mockAnchor = {
      href: "",
      download: "",
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, "createElement")
      .mockImplementation((tag) => {
        if (tag === "a") return mockAnchor;
        return originalCreateElement(tag);
      });
    const appendChildSpy = vi
      .spyOn(document.body, "appendChild")
      .mockImplementation(() => mockAnchor);
    const removeChildSpy = vi
      .spyOn(document.body, "removeChild")
      .mockImplementation(() => mockAnchor);
    const createObjectURLSpy = vi
      .spyOn(URL, "createObjectURL")
      .mockReturnValue("blob:mock");
    const revokeObjectURLSpy = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});

    // Create wrapper and render button inside it properly
    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-streamdown", "table-wrapper");
    wrapper.appendChild(mockTable.cloneNode(true));
    document.body.appendChild(wrapper);

    const buttonDiv = document.createElement("div");
    wrapper.appendChild(buttonDiv);

    render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton filename="custom-table" onDownload={onDownload} />
      </StreamdownRuntimeContext.Provider>,
      { container: buttonDiv }
    );

    const button = buttonDiv.querySelector("button");
    fireEvent.click(button!);

    expect(onDownload).toHaveBeenCalled();

    document.body.removeChild(wrapper);
    createElementSpy.mockRestore();
    appendChildSpy.mockRestore();
    removeChildSpy.mockRestore();
    createObjectURLSpy.mockRestore();
    revokeObjectURLSpy.mockRestore();
  });

  it("should call onError when table is not found", () => {
    const onError = vi.fn();

    // Render button outside of table wrapper
    const buttonDiv = document.createElement("div");
    document.body.appendChild(buttonDiv);

    render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton onError={onError} />
      </StreamdownRuntimeContext.Provider>,
      { container: buttonDiv }
    );

    const button = buttonDiv.querySelector("button");
    fireEvent.click(button!);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Table not found",
      })
    );

    document.body.removeChild(buttonDiv);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadButton className="custom-button-class" />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("custom-button-class");
  });
});

describe("TableDownloadDropdown", () => {
  let mockTable: HTMLTableElement;
  let mockWrapper: HTMLDivElement;

  beforeEach(() => {
    // Create a mock table structure
    mockTable = document.createElement("table");
    mockTable.innerHTML = `
      <thead>
        <tr>
          <th>Name</th>
          <th>Age</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John</td>
          <td>30</td>
        </tr>
      </tbody>
    `;

    mockWrapper = document.createElement("div");
    mockWrapper.setAttribute("data-streamdown", "table-wrapper");
    mockWrapper.appendChild(mockTable);
    document.body.appendChild(mockWrapper);

    vi.clearAllMocks();
  });

  afterEach(() => {
    document.body.removeChild(mockWrapper);
  });

  it("should render dropdown button", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Download table"]');
    expect(button).toBeTruthy();
  });

  it("should render custom children", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown>
          <span>Custom Text</span>
        </TableDownloadDropdown>
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    expect(container.textContent).toContain("Custom Text");
  });

  it("should be disabled when animating", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: true }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.hasAttribute("disabled")).toBe(true);
  });

  it("should toggle dropdown on button click", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Download table"]');

    // Dropdown should be closed initially
    expect(container.querySelector(".absolute")).toBeFalsy();

    // Click to open
    fireEvent.click(button!);
    expect(container.querySelector(".absolute")).toBeTruthy();

    // Click to close
    fireEvent.click(button!);
    expect(container.querySelector(".absolute")).toBeFalsy();
  });

  it("should show CSV and Markdown options when open", () => {
    const { container, getByText } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Download table"]');
    fireEvent.click(button!);

    expect(getByText("CSV")).toBeTruthy();
    expect(getByText("Markdown")).toBeTruthy();
  });

  it("should download CSV when CSV option is clicked", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();

    // Append dropdown to wrapper
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown onDownload={onDownload} />
      </StreamdownRuntimeContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Download table"]');
    fireEvent.click(button!);

    const csvButton = getByText("CSV");
    fireEvent.click(csvButton);

    expect(save).toHaveBeenCalledWith(
      "table.csv",
      expect.stringContaining("Name,Age"),
      "text/csv"
    );
    expect(onDownload).toHaveBeenCalledWith("csv");

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should download Markdown when Markdown option is clicked", async () => {
    const { save } = await import("../lib/utils");
    const onDownload = vi.fn();

    // Append dropdown to wrapper
    const dropdownContainer = document.createElement("div");
    mockWrapper.appendChild(dropdownContainer);

    const { container, getByText } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown onDownload={onDownload} />
      </StreamdownRuntimeContext.Provider>,
      { container: dropdownContainer }
    );

    const button = container.querySelector('button[title="Download table"]');
    fireEvent.click(button!);

    const markdownButton = getByText("Markdown");
    fireEvent.click(markdownButton);

    expect(save).toHaveBeenCalledWith(
      "table.md",
      expect.stringContaining("| Name | Age |"),
      "text/markdown"
    );
    expect(onDownload).toHaveBeenCalledWith("markdown");

    mockWrapper.removeChild(dropdownContainer);
  });

  it("should close dropdown on outside click", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector('button[title="Download table"]');
    fireEvent.click(button!);

    expect(container.querySelector(".absolute")).toBeTruthy();

    // Click outside
    fireEvent.mouseDown(document.body);

    expect(container.querySelector(".absolute")).toBeFalsy();
  });

  it("should call onError when table is not found", () => {
    const onError = vi.fn();

    // Render dropdown outside of table wrapper
    const dropdownDiv = document.createElement("div");
    document.body.appendChild(dropdownDiv);

    const { container, getByText } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown onError={onError} />
      </StreamdownRuntimeContext.Provider>,
      { container: dropdownDiv }
    );

    const button = container.querySelector('button[title="Download table"]');
    fireEvent.click(button!);

    const csvButton = getByText("CSV");
    fireEvent.click(csvButton);

    expect(onError).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Table not found",
      })
    );

    document.body.removeChild(dropdownDiv);
  });

  it("should apply custom className", () => {
    const { container } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown className="custom-dropdown-class" />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    const button = container.querySelector("button");
    expect(button?.className).toContain("custom-dropdown-class");
  });

  it("should cleanup event listener on unmount", () => {
    const removeEventListenerSpy = vi.spyOn(document, "removeEventListener");

    const { unmount } = render(
      <StreamdownRuntimeContext.Provider value={{ isAnimating: false }}>
        <TableDownloadDropdown />
      </StreamdownRuntimeContext.Provider>,
      { container: mockWrapper }
    );

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      "mousedown",
      expect.any(Function)
    );
  });
});
