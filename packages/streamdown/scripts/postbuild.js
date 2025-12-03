import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const distDir = join(process.cwd(), "dist");
const files = readdirSync(distDir).filter(
  (file) => file.endsWith(".js") || file.endsWith(".cjs")
);

for (const file of files) {
  const filePath = join(distDir, file);
  const content = readFileSync(filePath, "utf-8");

  if (!content.startsWith('"use client"')) {
    writeFileSync(filePath, `"use client";\n${content}`, "utf-8");
    console.log(`Added "use client" to ${file}`);
  }
}
