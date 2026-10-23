// Registry of plugins that parse raw HTML (rehype-raw). Kept separate from the
// rehype-raw import so lib/markdown.ts does not pull rehype-raw into the
// bundle just to detect it.
const rawPlugins = new WeakSet<object>();

export const registerRehypeRaw = (plugin: object): void => {
  rawPlugins.add(plugin);
};

export const isRehypeRaw = (plugin: unknown): boolean =>
  typeof plugin === "function" &&
  (rawPlugins.has(plugin) || plugin.name === "rehypeRaw");
