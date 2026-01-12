import { unlinkSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readFileSync } from "node:fs";
import { build } from "esbuild";

async function analyzeBundle(name, entryPoint, external) {
  const outfile = join(tmpdir(), `streamdown-${name}.js`);

  const result = await build({
    entryPoints: [entryPoint],
    bundle: true,
    minify: true,
    format: "esm",
    outfile,
    external,
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

  // Get gzipped size
  const bundleContent = readFileSync(outfile);
  const gzippedBytes = gzipSync(bundleContent).length;

  // Cleanup
  try {
    unlinkSync(outfile);
  } catch {
    // ignore
  }

  return { totalBytes, gzippedBytes, metafile: result.metafile };
}

function formatSize(bytes) {
  if (bytes >= 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`;
  }
  return `${(bytes / 1024).toFixed(0)}KB`;
}

async function main() {
  console.log("\n=== Streamdown Bundle Analysis ===\n");

  // Core bundle (what users get with just `import { Streamdown } from 'streamdown'`)
  console.log("1. CORE (no plugins) - externals: react, shiki, mermaid, katex");
  const core = await analyzeBundle("core", "dist/index.js", [
    "react",
    "react-dom",
    "shiki",
    "mermaid",
    "katex",
    "rehype-katex",
    "remark-math",
  ]);
  console.log(`   Minified: ${formatSize(core.totalBytes)}`);
  console.log(`   Gzipped:  ${formatSize(core.gzippedBytes)}`);

  // Shiki plugin only
  console.log("\n2. SHIKI PLUGIN - externals: react, shiki");
  const shikiPlugin = await analyzeBundle(
    "shiki-plugin",
    "dist/plugins/shiki/index.js",
    ["react", "react-dom", "shiki"]
  );
  console.log(`   Minified: ${formatSize(shikiPlugin.totalBytes)}`);
  console.log(`   Gzipped:  ${formatSize(shikiPlugin.gzippedBytes)}`);

  // Full bundle with shiki bundled (what Cloudflare would see)
  console.log("\n3. CORE + SHIKI BUNDLED (Cloudflare scenario)");
  const withShiki = await analyzeBundle("with-shiki", "dist/index.js", [
    "react",
    "react-dom",
    "mermaid",
    "katex",
    "rehype-katex",
    "remark-math",
  ]);
  console.log(`   Minified: ${formatSize(withShiki.totalBytes)}`);
  console.log(`   Gzipped:  ${formatSize(withShiki.gzippedBytes)}`);
  console.log(`   Cloudflare Workers limit: 1MB compressed (free) / 10MB (paid)`);

  // Top dependencies in full bundle
  console.log("\n4. TOP 15 LARGEST FILES (in full bundle):\n");
  const inputs = Object.entries(withShiki.metafile.inputs)
    .map(([path, data]) => ({ path, bytes: data.bytes }))
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, 15);

  for (const { path, bytes } of inputs) {
    const shortPath = path.replace(
      /node_modules\/\.pnpm\/[^/]+\/node_modules\//g,
      ""
    );
    console.log(`   ${formatSize(bytes).padStart(8)} - ${shortPath}`);
  }

  console.log("");
}

main().catch((err) => {
  console.error("Bundle analysis failed:", err.message);
  process.exit(1);
});
