import { render } from "@testing-library/react";
import type { Root } from "hast";
import { toJsxRuntime } from "hast-util-to-jsx-runtime";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import rehypeParse from "rehype-parse";
import { unified } from "unified";
import { describe, expect, it } from "vitest";
import {
  type AnimateOptions,
  type AnimatePlugin,
  createAnimatePlugin,
  createRenderAnimatePlugin,
} from "../lib/animate";

const html =
  "<p>Some <strong>bold words</strong> and a <a href='#'>link</a>.</p><ul><li>item one</li></ul>";

const renderWith = (plugin: AnimatePlugin): string => {
  const processor = unified()
    .use(rehypeParse, { fragment: true })
    .use(plugin.rehypePlugin);
  const tree = processor.runSync(processor.parse(html)) as Root;
  return render(
    toJsxRuntime(tree, { Fragment, jsx, jsxs, ignoreInvalidStyle: true })
  ).container.innerHTML;
};

// Streamdown's plugin hands React style objects, which must render the same
// markup as the CSS strings the exported plugin writes.
describe("createRenderAnimatePlugin", () => {
  it.each<{ name: string; options?: AnimateOptions }>([
    { name: "the defaults" },
    {
      name: "a cubic-bezier easing",
      options: { easing: "cubic-bezier(0.4, 0, 0.2, 1)" },
    },
    {
      name: "an easing with outer whitespace",
      options: { easing: " ease-in " },
    },
    {
      name: "an easing with a declaration break",
      options: { easing: "ease;color:red" },
    },
    { name: "an empty easing", options: { easing: "" } },
    {
      name: "character splitting",
      options: { sep: "char", animation: "blurIn" },
    },
  ])("renders $name like the exported plugin", ({ options }) => {
    expect(renderWith(createRenderAnimatePlugin(options))).toBe(
      renderWith(createAnimatePlugin(options))
    );
  });
});
