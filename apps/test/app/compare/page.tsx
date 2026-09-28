import { readFile } from "node:fs/promises";
import path from "node:path";
import { Compare } from "./compare";

const PACKAGES = {
  released: "streamdown-released",
  local: "streamdown",
} as const;

// Read from disk because the packages' `exports` field doesn't expose package.json.
const readVersion = async (name: string) => {
  try {
    const file = path.join(process.cwd(), "node_modules", name, "package.json");
    const pkg = JSON.parse(await readFile(file, "utf8")) as {
      version?: string;
    };
    return pkg.version ?? "unknown";
  } catch {
    return "unknown";
  }
};

export default async function ComparePage() {
  const [releasedVersion, localVersion] = await Promise.all([
    readVersion(PACKAGES.released),
    readVersion(PACKAGES.local),
  ]);

  return (
    <Compare localVersion={localVersion} releasedVersion={releasedVersion} />
  );
}
