import { build } from "esbuild";
import { unlinkSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const outfile = join(tmpdir(), "streamdown-bundle.js");

async function analyzeBundle() {
  const result = await build({
    entryPoints: ["dist/index.js"],
    bundle: true,
    minify: true,
    format: "esm",
    outfile,
    external: ["react", "react-dom"],
    loader: {
      ".woff2": "empty",
      ".woff": "empty",
      ".ttf": "empty",
      ".css": "empty",
    },
    metafile: true,
    logLevel: "silent",
  });

  const outputKey = Object.keys(result.metafile.outputs)[0];
  const totalBytes = result.metafile.outputs[outputKey]?.bytes || 0;
  const totalMB = (totalBytes / 1024 / 1024).toFixed(2);

  console.log(
    `\nTotal bundle size: ${totalMB}MB (${(totalBytes / 1024).toFixed(0)}KB)\n`
  );
  console.log("Top 20 largest dependencies:\n");

  const inputs = Object.entries(result.metafile.inputs)
    .map(([path, data]) => ({ path, bytes: data.bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 20);

  for (const { path, bytes } of inputs) {
    const sizeMB = (bytes / 1024 / 1024).toFixed(2);
    const sizeKB = (bytes / 1024).toFixed(0);
    const display = bytes >= 1024 * 1024 ? `${sizeMB}MB` : `${sizeKB}KB`;
    const shortPath = path.replace(
      /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
      ""
    );
    console.log(`  ${display.padStart(8)} - ${shortPath}`);
  }

  // Cleanup
  try {
    unlinkSync(outfile);
  } catch {}

  console.log("");
}

analyzeBundle().catch((err) => {
  console.error("Bundle analysis failed:", err.message);
  process.exit(1);
});
