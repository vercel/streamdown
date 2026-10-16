import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bundleConsumer, type ConsumerBundle } from "./built-consumer";

const mermaidMarkers = {
  "block controls": /["']mermaid-block-actions["']/,
  chart: /["']data-streamdown["']\s*:\s*["']mermaid["']/,
  "fullscreen view": /["']mermaid-fullscreen["']/,
};

describe("Mermaid bundle boundary", () => {
  let workDir = "";
  let bundle: ConsumerBundle;

  beforeAll(() => {
    workDir = mkdtempSync(path.join(tmpdir(), "streamdown-consumer-"));
    bundle = bundleConsumer(workDir);
  }, 60_000);

  afterAll(() => {
    if (workDir) {
      rmSync(workDir, { force: true, recursive: true });
    }
  });

  it.each(
    Object.entries(mermaidMarkers)
  )("loads the Mermaid %s only through import()", (_name, marker) => {
    expect(bundle.upFront).not.toMatch(marker);
    expect(bundle.deferred).toMatch(marker);
  });
});
