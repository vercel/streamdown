import { render } from "@testing-library/react";
import type { Root } from "hast";
import type { PluggableList, Plugin } from "unified";
import { visit } from "unist-util-visit";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";
import { Markdown, type Options } from "../lib/markdown";

const createPlugin = (value: string): Plugin<[{ suffix?: string }?], Root> =>
  function replaceText(options) {
    return (tree) => {
      visit(tree, "text", (node) => {
        node.value = value + (options?.suffix ?? "");
      });
    };
  };

describe("processor plugin identity", () => {
  for (const stage of ["remarkPlugins", "rehypePlugins"] as const) {
    for (const tuple of [false, true]) {
      it(`isolates same-name ${stage} with tuple=${tuple}`, () => {
        const first = createPlugin("first");
        const second = createPlugin("second");
        expect(first.name).toBe(second.name);
        const plugins = (plugin: typeof first): PluggableList =>
          tuple ? [[plugin, { suffix: "!" }]] : [plugin];
        const { container, rerender } = render(
          <Markdown {...{ [stage]: plugins(first) }}>input</Markdown>
        );
        expect(container.textContent).toBe(tuple ? "first!" : "first");
        rerender(<Markdown {...{ [stage]: plugins(second) }}>input</Markdown>);
        expect(container.textContent).toBe(tuple ? "second!" : "second");
        rerender(<Markdown {...{ [stage]: plugins(first) }}>input</Markdown>);
        expect(container.textContent).toBe(tuple ? "first!" : "first");
      });
    }
  }

  it("reuses the same function across new plugin arrays", () => {
    let setups = 0;
    const plugin: Plugin = () => {
      setups += 1;
    };
    const { rerender } = render(
      <Markdown remarkPlugins={[plugin]}>first</Markdown>
    );
    rerender(<Markdown remarkPlugins={[plugin]}>second</Markdown>);
    expect(setups).toBe(1);
  });

  it("keeps options distinct for the same function", () => {
    const plugin = createPlugin("text");
    const { container, rerender } = render(
      <Markdown remarkPlugins={[[plugin, { suffix: "1" }]]}>input</Markdown>
    );
    expect(container.textContent).toBe("text1");
    rerender(
      <Markdown remarkPlugins={[[plugin, { suffix: "2" }]]}>input</Markdown>
    );
    expect(container.textContent).toBe("text2");
  });

  for (const mode of ["static", "streaming"] as const) {
    it(`isolates simultaneous Streamdown instances in ${mode} mode`, () => {
      const first = createPlugin("left");
      const second = createPlugin("right");
      const { container } = render(
        <>
          <section data-testid="left">
            <Streamdown mode={mode} remarkPlugins={[first]}>
              input
            </Streamdown>
          </section>
          <section data-testid="right">
            <Streamdown mode={mode} remarkPlugins={[second]}>
              input
            </Streamdown>
          </section>
        </>
      );
      expect(container.querySelector('[data-testid="left"]')?.textContent).toBe(
        "left"
      );
      expect(
        container.querySelector('[data-testid="right"]')?.textContent
      ).toBe("right");
    });
  }
});

describe("processor callback options", () => {
  for (const stage of ["remarkPlugins", "rehypePlugins"] as const) {
    for (const mode of ["static", "streaming"] as const) {
      it(`isolates callback options in ${stage}, ${mode}`, () => {
        const plugin: Plugin<[{ format: (text: string) => string }], Root> =
          (options) => (tree) => {
            visit(tree, "text", (node) => {
              node.value = options.format(node.value);
            });
          };
        const content = (label: string) => (
          <Streamdown
            mode={mode}
            {...{
              [stage]: [[plugin, { format: (text: string) => label + text }]],
            }}
          >
            input
          </Streamdown>
        );
        const { container } = render(
          <>
            {content("left:")}
            {content("right:")}
          </>
        );
        expect(container.textContent).toBe("left:inputright:input");
      });
    }
  }

  for (const mode of ["static", "streaming"] as const) {
    it(`isolates remark-rehype handlers in ${mode}`, () => {
      const options = (text: string): Options["remarkRehypeOptions"] => ({
        handlers: {
          strong: () => ({ type: "text", value: text }),
        },
      });
      const { container } = render(
        <>
          <Streamdown mode={mode} remarkRehypeOptions={options("left")}>
            **input**
          </Streamdown>
          <Streamdown mode={mode} remarkRehypeOptions={options("right")}>
            **input**
          </Streamdown>
        </>
      );
      expect(container.textContent).toBe("leftright");
    });
  }

  it("reuses processors for the same callback in new option wrappers", () => {
    let setups = 0;
    const plugin: Plugin<[{ format: () => string }], Root> = (options) => {
      setups += 1;
      return (tree) => {
        visit(tree, "text", (node) => {
          node.value = options.format();
        });
      };
    };
    const format = () => "formatted";
    const { container, rerender } = render(
      <Markdown remarkPlugins={[[plugin, { format }]]}>first</Markdown>
    );
    rerender(
      <Markdown remarkPlugins={[[plugin, { format }]]}>second</Markdown>
    );
    expect(container.textContent).toBe("formatted");
    expect(setups).toBe(1);
  });

  it("distinguishes callback paths and ordinary JSON data", () => {
    interface Config {
      left?: { format?: () => string };
      right?: { format?: () => string };
      value?: unknown;
    }
    const plugin: Plugin<[Config], Root> = (options) => (tree) => {
      visit(tree, "text", (node) => {
        if (options.left?.format) {
          node.value = `left:${options.left.format()}`;
        } else if (options.right?.format) {
          node.value = `right:${options.right.format()}`;
        } else {
          node.value = JSON.stringify(options.value);
        }
      });
    };
    const callback = () => "callback";
    const cases: [Config, string][] = [
      [{ left: { format: callback }, right: {} }, "left:callback"],
      [{ left: {}, right: { format: callback } }, "right:callback"],
      [{ value: "callback" }, '"callback"'],
      [{ value: ["function", 0] }, '["function",0]'],
      [{ value: { handlers: { strong: 0 } } }, '{"handlers":{"strong":0}}'],
    ];
    for (const [options, expected] of cases) {
      const { container, unmount } = render(
        <Markdown remarkPlugins={[[plugin, options]]}>input</Markdown>
      );
      expect(container.textContent).toBe(expected);
      unmount();
    }
  });
});
