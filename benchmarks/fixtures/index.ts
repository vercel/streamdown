import { readFileSync } from "node:fs";
import { join } from "node:path";

const fixturesDir = __dirname;

export const fixtures = {
  small: readFileSync(join(fixturesDir, "small.md"), "utf-8"),
  medium: readFileSync(join(fixturesDir, "medium.md"), "utf-8"),
  large: readFileSync(join(fixturesDir, "large.md"), "utf-8"),
  codeHeavy: readFileSync(join(fixturesDir, "code-heavy.md"), "utf-8"),
  streaming: readFileSync(join(fixturesDir, "streaming.md"), "utf-8"),
} as const;

export type FixtureKey = keyof typeof fixtures;
