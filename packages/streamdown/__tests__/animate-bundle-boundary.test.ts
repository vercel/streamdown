import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { bundleConsumer, type ConsumerBundle } from "./built-consumer";

// The engine names each rehype plugin it creates `rehypeAnimate$<id>`.
const engineMarker = /rehypeAnimate\$/;

describe("word fade bundle boundary", () => {
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

  it("loads the word fade only through import() in an app that never imports it", () => {
    expect(bundle.upFront).not.toMatch(engineMarker);
    expect(bundle.deferred).toMatch(engineMarker);
  });
});
