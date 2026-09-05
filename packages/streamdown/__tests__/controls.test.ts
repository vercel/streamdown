import { describe, expect, it, vi } from "vitest";
import { getCopyCallbacks, getDownloadFilename } from "../lib/controls";

describe("getDownloadFilename", () => {
  it("returns the fallback when controls is a boolean", () => {
    expect(getDownloadFilename(true, "code", "file")).toBe("file");
    expect(getDownloadFilename(false, "table", "table")).toBe("table");
  });

  it("returns the fallback when the block type is not configured", () => {
    expect(getDownloadFilename({}, "code", "file")).toBe("file");
    expect(getDownloadFilename({ table: true }, "code", "file")).toBe("file");
  });

  it("returns the fallback when the block type is a boolean", () => {
    expect(getDownloadFilename({ mermaid: true }, "mermaid", "diagram")).toBe(
      "diagram"
    );
    expect(getDownloadFilename({ mermaid: false }, "mermaid", "diagram")).toBe(
      "diagram"
    );
  });

  it("returns the fallback when download is a boolean", () => {
    expect(
      getDownloadFilename({ code: { download: true } }, "code", "file")
    ).toBe("file");
    expect(
      getDownloadFilename({ table: { download: false } }, "table", "table")
    ).toBe("table");
  });

  it("returns the custom filename when download is configured", () => {
    expect(
      getDownloadFilename(
        { code: { download: { filename: "myScript" } } },
        "code",
        "file"
      )
    ).toBe("myScript");
    expect(
      getDownloadFilename(
        { table: { download: { filename: "report" } } },
        "table",
        "table"
      )
    ).toBe("report");
    expect(
      getDownloadFilename(
        { mermaid: { download: { filename: "flowchart" } } },
        "mermaid",
        "diagram"
      )
    ).toBe("flowchart");
  });

  it("returns the fallback when filename is empty", () => {
    expect(
      getDownloadFilename(
        { code: { download: { filename: "" } } },
        "code",
        "file"
      )
    ).toBe("file");
  });
});

describe("getCopyCallbacks", () => {
  it("returns empty callbacks when controls is a boolean", () => {
    expect(getCopyCallbacks(true, "code")).toEqual({});
    expect(getCopyCallbacks(false, "mermaid")).toEqual({});
  });

  it("returns empty callbacks when the block type is not configured", () => {
    expect(getCopyCallbacks({}, "code")).toEqual({});
    expect(getCopyCallbacks({ table: true }, "code")).toEqual({});
  });

  it("returns empty callbacks when the block type is a boolean", () => {
    expect(getCopyCallbacks({ code: true }, "code")).toEqual({});
    expect(getCopyCallbacks({ mermaid: false }, "mermaid")).toEqual({});
  });

  it("returns empty callbacks when copy is a boolean", () => {
    expect(getCopyCallbacks({ code: { copy: true } }, "code")).toEqual({});
    expect(getCopyCallbacks({ code: { copy: false } }, "code")).toEqual({});
    expect(getCopyCallbacks({ mermaid: { copy: true } }, "mermaid")).toEqual(
      {}
    );
  });

  it("returns onCopy and onError from copy config", () => {
    const onCopy = vi.fn();
    const onError = vi.fn();

    expect(
      getCopyCallbacks({ code: { copy: { onCopy, onError } } }, "code")
    ).toEqual({ onCopy, onError });
    expect(
      getCopyCallbacks({ mermaid: { copy: { onCopy, onError } } }, "mermaid")
    ).toEqual({ onCopy, onError });
  });

  it("returns partial callbacks when only one is provided", () => {
    const onCopy = vi.fn();
    expect(getCopyCallbacks({ code: { copy: { onCopy } } }, "code")).toEqual({
      onCopy,
      onError: undefined,
    });

    const onError = vi.fn();
    expect(
      getCopyCallbacks({ mermaid: { copy: { onError } } }, "mermaid")
    ).toEqual({ onCopy: undefined, onError });
  });
});
