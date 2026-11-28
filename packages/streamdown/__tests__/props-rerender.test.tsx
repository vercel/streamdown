import { render } from "@testing-library/react";
import { useContext } from "react";
import type { Pluggable } from "unified";
import { describe, expect, it, vi } from "vitest";
import {
  Block,
  type BlockProps,
  type ExtraProps,
  Streamdown,
  StreamdownContext,
} from "../index";
import { useIcons } from "../lib/icon-context";

const components = {
  p: ({ children }: ExtraProps & { children?: React.ReactNode }) => {
    const ctx = useContext(StreamdownContext);
    return (
      <p
        data-controls={JSON.stringify(ctx.controls)}
        data-mermaid={JSON.stringify(ctx.mermaid?.config)}
        data-portal={ctx.portal ? "set" : "unset"}
      >
        {children}
      </p>
    );
  },
};

const uppercase = () => (tree: { children: unknown[] }) => {
  const visit = (node: any) => {
    if (node.type === "text") {
      node.value = node.value.toUpperCase();
    }
    for (const child of node.children ?? []) {
      visit(child);
    }
  };
  visit(tree);
};

describe("Streamdown prop changes with unchanged Markdown", () => {
  for (const mode of ["static", "streaming"] as const) {
    describe(`${mode} mode`, () => {
      it("applies a changed mermaid option", () => {
        const { container, rerender } = render(
          <Streamdown
            components={components}
            mermaid={{ config: { theme: "default" } }}
            mode={mode}
          >
            hello
          </Streamdown>
        );
        const p = () => container.querySelector("p");
        expect(p()?.getAttribute("data-mermaid")).toBe('{"theme":"default"}');
        rerender(
          <Streamdown
            components={components}
            mermaid={{ config: { theme: "dark" } }}
            mode={mode}
          >
            hello
          </Streamdown>
        );
        expect(p()?.getAttribute("data-mermaid")).toBe('{"theme":"dark"}');
      });

      it("applies changed controls", () => {
        const { container, rerender } = render(
          <Streamdown components={components} controls={true} mode={mode}>
            hello
          </Streamdown>
        );
        expect(
          container.querySelector("p")?.getAttribute("data-controls")
        ).toBe("true");
        rerender(
          <Streamdown components={components} controls={false} mode={mode}>
            hello
          </Streamdown>
        );
        expect(
          container.querySelector("p")?.getAttribute("data-controls")
        ).toBe("false");
      });

      it("applies a changed portal", () => {
        const { container, rerender } = render(
          <Streamdown components={components} mode={mode}>
            hello
          </Streamdown>
        );
        expect(container.querySelector("p")?.getAttribute("data-portal")).toBe(
          "unset"
        );
        rerender(
          <Streamdown
            components={components}
            mode={mode}
            portal={document.body}
          >
            hello
          </Streamdown>
        );
        expect(container.querySelector("p")?.getAttribute("data-portal")).toBe(
          "set"
        );
      });

      it("applies changed remarkPlugins", () => {
        const { container, rerender } = render(
          <Streamdown mode={mode} remarkPlugins={[]}>
            hello
          </Streamdown>
        );
        expect(container.textContent).toBe("hello");
        rerender(
          <Streamdown mode={mode} remarkPlugins={[uppercase as Pluggable]}>
            hello
          </Streamdown>
        );
        expect(container.textContent).toBe("HELLO");
      });

      it("applies changed rehypePlugins", () => {
        const { container, rerender } = render(
          <Streamdown mode={mode} rehypePlugins={[]}>
            hello
          </Streamdown>
        );
        expect(container.textContent).toBe("hello");
        rerender(
          <Streamdown mode={mode} rehypePlugins={[uppercase as Pluggable]}>
            hello
          </Streamdown>
        );
        expect(container.textContent).toBe("HELLO");
      });

      it("applies changed allowedTags", () => {
        const { container, rerender } = render(
          <Streamdown mode={mode}>
            {'<mention user_id="1">hi</mention>'}
          </Streamdown>
        );
        expect(container.querySelector("mention")).toBeNull();
        rerender(
          <Streamdown allowedTags={{ mention: ["user_id"] }} mode={mode}>
            {'<mention user_id="1">hi</mention>'}
          </Streamdown>
        );
        expect(
          container.querySelector("mention")?.getAttribute("user_id")
        ).toBe("1");
      });

      it("applies changed icons", () => {
        const Probe = ({
          children,
        }: ExtraProps & { children?: React.ReactNode }) => {
          const icons = useIcons();
          const Icon = icons.CheckIcon;
          return (
            <p>
              <Icon data-testid="probe-icon" />
              {children}
            </p>
          );
        };
        const Custom = (props: React.SVGProps<SVGSVGElement>) => (
          <svg data-custom="yes" {...props}>
            <title>custom</title>
          </svg>
        );
        const { container, rerender } = render(
          <Streamdown components={{ p: Probe }} mode={mode}>
            hello
          </Streamdown>
        );
        expect(
          container
            .querySelector("[data-testid='probe-icon']")
            ?.getAttribute("data-custom")
        ).toBeNull();
        rerender(
          <Streamdown
            components={{ p: Probe }}
            icons={{ CheckIcon: Custom }}
            mode={mode}
          >
            hello
          </Streamdown>
        );
        expect(
          container
            .querySelector("[data-testid='probe-icon']")
            ?.getAttribute("data-custom")
        ).toBe("yes");
      });
    });
  }

  describe("streaming mode only", () => {
    it("applies a changed caret while animating", () => {
      const { container, rerender } = render(
        <Streamdown isAnimating mode="streaming">
          hello
        </Streamdown>
      );
      const root = () => container.firstElementChild as HTMLElement;
      expect(root().style.getPropertyValue("--streamdown-caret")).toBe("");
      rerender(
        <Streamdown caret="block" isAnimating mode="streaming">
          hello
        </Streamdown>
      );
      expect(root().style.getPropertyValue("--streamdown-caret")).not.toBe("");
    });

    it("applies a changed parseIncompleteMarkdown", () => {
      const { container, rerender } = render(
        <Streamdown mode="streaming" parseIncompleteMarkdown={false}>
          **bold
        </Streamdown>
      );
      expect(container.querySelector("[data-streamdown='strong']")).toBeNull();
      rerender(
        <Streamdown mode="streaming" parseIncompleteMarkdown={true}>
          **bold
        </Streamdown>
      );
      expect(
        container.querySelector("[data-streamdown='strong']")
      ).not.toBeNull();
    });

    it("applies changed remend options", () => {
      const { container, rerender } = render(
        <Streamdown mode="streaming" remend={{ bold: false }}>
          **bold
        </Streamdown>
      );
      expect(container.querySelector("[data-streamdown='strong']")).toBeNull();
      rerender(
        <Streamdown mode="streaming" remend={{ bold: true }}>
          **bold
        </Streamdown>
      );
      expect(
        container.querySelector("[data-streamdown='strong']")
      ).not.toBeNull();
    });

    it("applies a changed parseMarkdownIntoBlocksFn", () => {
      const Counter = (props: BlockProps) => (
        <div data-block-index={props.index}>
          <Block {...props} />
        </div>
      );
      const { container, rerender } = render(
        <Streamdown
          BlockComponent={Counter}
          mode="streaming"
          parseMarkdownIntoBlocksFn={(md) => [md]}
        >
          {"a\n\nb"}
        </Streamdown>
      );
      expect(container.querySelectorAll("[data-block-index]").length).toBe(1);
      rerender(
        <Streamdown
          BlockComponent={Counter}
          mode="streaming"
          parseMarkdownIntoBlocksFn={(md) => md.split("\n\n")}
        >
          {"a\n\nb"}
        </Streamdown>
      );
      expect(container.querySelectorAll("[data-block-index]").length).toBe(2);
    });

    it("applies a changed BlockComponent", () => {
      const Custom = (props: BlockProps) => (
        <div data-custom-block="yes">
          <Block {...props} />
        </div>
      );
      const { container, rerender } = render(
        <Streamdown mode="streaming">hello</Streamdown>
      );
      expect(container.querySelector("[data-custom-block]")).toBeNull();
      rerender(
        <Streamdown BlockComponent={Custom} mode="streaming">
          hello
        </Streamdown>
      );
      expect(container.querySelector("[data-custom-block]")).not.toBeNull();
    });
  });

  it("does not re-render when inline config props are structurally equal", () => {
    const renderSpy = vi.fn();
    const Probe = ({
      children,
    }: ExtraProps & { children?: React.ReactNode }) => {
      renderSpy();
      return <p>{children}</p>;
    };
    const props = () => ({
      allowedTags: { mention: ["user_id"] },
      components: { p: Probe },
      controls: { code: { copy: true } },
      mermaid: { config: { theme: "default" as const } },
      remarkPlugins: [] as Pluggable[],
    });
    const { rerender } = render(<Streamdown {...props()}>hello</Streamdown>);
    const calls = renderSpy.mock.calls.length;
    rerender(<Streamdown {...props()}>hello</Streamdown>);
    expect(renderSpy.mock.calls.length).toBe(calls);
  });
});
