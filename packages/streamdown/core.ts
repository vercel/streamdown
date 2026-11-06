// Same API as "streamdown", but the default rehype plugins do not include
// rehype-raw, so rehype-raw and parse5 are not bundled. Raw HTML is escaped
// unless you pass your own `rehype-raw` in `rehypePlugins`.
// biome-ignore lint/performance/noBarrelFile: "streamdown/core" is a public entry point
export * from "./index";
