import rehypeRaw from "rehype-raw";
import { registerRehypeRaw } from "./raw-registry";

// The only module that imports rehype-raw. The `streamdown/core` build swaps
// it for ./default-raw.core so rehype-raw and parse5 are tree-shaken.
registerRehypeRaw(rehypeRaw);

export const defaultRaw = rehypeRaw;
