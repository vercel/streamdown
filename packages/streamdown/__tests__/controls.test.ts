import { describe, expect, it } from "vitest";
import { getDownloadFilename } from "../lib/controls";

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
