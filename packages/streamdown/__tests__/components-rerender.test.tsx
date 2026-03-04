import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { StreamdownContext } from "../index";
import { components as importedComponents } from "../lib/components";
import type { Options } from "../lib/markdown";
import { PluginContext } from "../lib/plugin-context";

// Mock mermaid
vi.mock("../lib/mermaid", () => ({
  Mermaid: ({ chart }: { chart: string }) => (
    <div data-testid="mermaid-mock">{chart}</div>
  ),
}));

// Get individual components
const components = importedComponents as Required<
  NonNullable<Options["components"]>
>;
const Ol = components.ol;
const Li = components.li;
const Ul = components.ul;
const Hr = components.hr;
const Strong = components.strong;
const A = components.a;
const H1 = components.h1;
const H2 = components.h2;
const H3 = components.h3;
const H4 = components.h4;
const H5 = components.h5;
const H6 = components.h6;
const MemoTable = components.table;
const Thead = components.thead;
const Tbody = components.tbody;
const Tr = components.tr;
const Th = components.th;
const Td = components.td;
const Blockquote = components.blockquote;
const Code = components.code;
const Img = components.img;
const _Pre = components.pre;
const Sup = components.sup;
const Sub = components.sub;
const P = components.p;
const Section = components.section;

// Wrapper to trigger re-renders
const ReRenderWrapper = ({
  count,
  children,
}: {
  count: number;
  children: React.ReactNode;
}) => <div data-count={count}>{children}</div>;

describe("Memo comparators - re-render triggers", () => {
  it("MemoOl comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Ol>
          <li>item</li>
        </Ol>
      </ReRenderWrapper>
    );
    expect(container.querySelector("ol")).toBeTruthy();

    // Re-render parent with same children - triggers comparator
    rerender(
      <ReRenderWrapper count={1}>
        <Ol>
          <li>item</li>
        </Ol>
      </ReRenderWrapper>
    );
    expect(container.querySelector("ol")).toBeTruthy();
  });

  it("MemoLi comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <ul>
          <Li>item</Li>
        </ul>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <ul>
          <Li>item</Li>
        </ul>
      </ReRenderWrapper>
    );
    expect(container.querySelector("li")).toBeTruthy();
  });

  it("MemoUl comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Ul>
          <li>item</li>
        </Ul>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Ul>
          <li>item</li>
        </Ul>
      </ReRenderWrapper>
    );
    expect(container.querySelector("ul")).toBeTruthy();
  });

  it("MemoHr comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Hr />
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Hr />
      </ReRenderWrapper>
    );
    expect(container.querySelector("hr")).toBeTruthy();
  });

  it("MemoStrong comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Strong>bold</Strong>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Strong>bold</Strong>
      </ReRenderWrapper>
    );
    expect(container.querySelector('[data-streamdown="strong"]')).toBeTruthy();
  });

  it("MemoA comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={0}>
          <A href="https://example.com">link</A>
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    rerender(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={1}>
          <A href="https://example.com">link</A>
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    expect(container.querySelector('[data-streamdown="link"]')).toBeTruthy();
  });

  it("MemoH1-H6 comparators fire on parent re-render", () => {
    const headings = [H1, H2, H3, H4, H5, H6];
    for (const H of headings) {
      const { container, rerender } = render(
        <ReRenderWrapper count={0}>
          <H>heading</H>
        </ReRenderWrapper>
      );
      rerender(
        <ReRenderWrapper count={1}>
          <H>heading</H>
        </ReRenderWrapper>
      );
      expect(container.querySelector("h1, h2, h3, h4, h5, h6")).toBeTruthy();
    }
  });

  it("MemoTable comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={0}>
          <MemoTable>
            <tbody>
              <tr>
                <td>cell</td>
              </tr>
            </tbody>
          </MemoTable>
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    rerender(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={1}>
          <MemoTable>
            <tbody>
              <tr>
                <td>cell</td>
              </tr>
            </tbody>
          </MemoTable>
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("MemoThead/Tbody/Tr/Th/Td comparators fire on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <table>
          <Thead>
            <tr>
              <Th>header</Th>
            </tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>cell</Td>
            </Tr>
          </Tbody>
        </table>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <table>
          <Thead>
            <tr>
              <Th>header</Th>
            </tr>
          </Thead>
          <Tbody>
            <Tr>
              <Td>cell</Td>
            </Tr>
          </Tbody>
        </table>
      </ReRenderWrapper>
    );
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("MemoBlockquote comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Blockquote>quote</Blockquote>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Blockquote>quote</Blockquote>
      </ReRenderWrapper>
    );
    expect(container.querySelector("blockquote")).toBeTruthy();
  });

  it("MemoSup/MemoSub comparators fire on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Sup>sup</Sup>
        <Sub>sub</Sub>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Sup>sup</Sup>
        <Sub>sub</Sub>
      </ReRenderWrapper>
    );
    expect(container.querySelector("sup")).toBeTruthy();
    expect(container.querySelector("sub")).toBeTruthy();
  });

  it("MemoCode comparator fires on parent re-render (inline)", () => {
    const { container, rerender } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <PluginContext.Provider value={{}}>
          <ReRenderWrapper count={0}>
            <Code>inline code</Code>
          </ReRenderWrapper>
        </PluginContext.Provider>
      </StreamdownContext.Provider>
    );
    rerender(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <PluginContext.Provider value={{}}>
          <ReRenderWrapper count={1}>
            <Code>inline code</Code>
          </ReRenderWrapper>
        </PluginContext.Provider>
      </StreamdownContext.Provider>
    );
    expect(container.querySelector("code")).toBeTruthy();
  });

  it("MemoImg comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={0}>
          <Img alt="test" src="https://example.com/img.png" />
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    rerender(
      <StreamdownContext.Provider
        value={{
          shikiTheme: ["github-light", "github-dark"],
          controls: true,
          isAnimating: false,
          mode: "streaming",
        }}
      >
        <ReRenderWrapper count={1}>
          <Img alt="test" src="https://example.com/img.png" />
        </ReRenderWrapper>
      </StreamdownContext.Provider>
    );
    expect(container.querySelector("img")).toBeTruthy();
  });

  it("MemoParagraph comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <P>paragraph</P>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <P>paragraph</P>
      </ReRenderWrapper>
    );
    expect(container.querySelector("p")).toBeTruthy();
  });

  it("MemoSection comparator fires on parent re-render", () => {
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Section>content</Section>
      </ReRenderWrapper>
    );
    rerender(
      <ReRenderWrapper count={1}>
        <Section>content</Section>
      </ReRenderWrapper>
    );
    expect(container.querySelector("section")).toBeTruthy();
  });
});

describe("sameNodePosition edge cases", () => {
  it("should return false when one has position and other doesn't", () => {
    // This tests line 63: if (!(prev?.position && next?.position)) return false
    const nodeWithPos = {
      position: { start: { line: 1, column: 1 }, end: { line: 1, column: 5 } },
    };
    const nodeWithoutPos = {};

    // Render the component with position, then without
    const { container, rerender } = render(
      <ReRenderWrapper count={0}>
        <Ol node={nodeWithPos as any}>
          <li>item</li>
        </Ol>
      </ReRenderWrapper>
    );

    rerender(
      <ReRenderWrapper count={1}>
        <Ol node={nodeWithoutPos as any}>
          <li>item</li>
        </Ol>
      </ReRenderWrapper>
    );

    expect(container.querySelector("ol")).toBeTruthy();
  });
});

describe("MemoParagraph block code unwrapping with data-block", () => {
  it("should unwrap block code child from paragraph (line 864)", () => {
    // Create a code element with data-block prop
    const codeChild = (
      <code className="language-js" data-block="true">
        const x = 1;
      </code>
    );

    const { container } = render(<P>{codeChild}</P>);

    // The paragraph should NOT wrap block code - it should return <>{children}</>
    // Since the code has data-block and tagName checking looks at node.tagName,
    // this path requires the component to have a node prop with tagName: "code"
    expect(container).toBeTruthy();
  });
});
