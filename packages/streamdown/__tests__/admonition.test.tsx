import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("admonition - remark plugin", () => {
  it("should render > [!NOTE] as an admonition", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE]\n> This is a note."}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeTruthy();
    expect(admonition?.getAttribute("data-admonition-type")).toBe("note");
    expect(admonition?.textContent).toContain("This is a note.");
  });

  it("should render all 5 types correctly", () => {
    const types = ["NOTE", "TIP", "IMPORTANT", "WARNING", "CAUTION"] as const;
    for (const type of types) {
      const { container } = render(
        <Streamdown mode="static">
          {`> [!${type}]\n> Content for ${type}.`}
        </Streamdown>
      );

      const admonition = container.querySelector('[data-streamdown="admonition"]');
      expect(admonition).toBeTruthy();
      expect(admonition?.getAttribute("data-admonition-type")).toBe(type.toLowerCase());
    }
  });

  it("should preserve normal blockquotes", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> This is a normal quote."}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeNull();

    const blockquote = container.querySelector('[data-streamdown="blockquote"]');
    expect(blockquote).toBeTruthy();
  });

  it("should handle multi-line content", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE]\n> Line 1\n> Line 2"}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeTruthy();
    expect(admonition?.textContent).toContain("Line 1");
    expect(admonition?.textContent).toContain("Line 2");
  });

  it("should handle empty body (streaming scenario)", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE]"}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeTruthy();
    expect(admonition?.getAttribute("data-admonition-type")).toBe("note");
  });

  it("should be case insensitive", () => {
    for (const variant of ["[!note]", "[!Note]", "[!NOTE]"]) {
      const { container } = render(
        <Streamdown mode="static">
          {`> ${variant}\n> Content`}
        </Streamdown>
      );

      const admonition = container.querySelector('[data-streamdown="admonition"]');
      expect(admonition).toBeTruthy();
      expect(admonition?.getAttribute("data-admonition-type")).toBe("note");
    }
  });

  it("should leave invalid types as normal blockquotes", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!INVALID]\n> Content"}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeNull();

    const blockquote = container.querySelector('[data-streamdown="blockquote"]');
    expect(blockquote).toBeTruthy();
  });

  it("should preserve inline text after type marker", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE] Some inline text"}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeTruthy();
    expect(admonition?.textContent).toContain("Some inline text");
  });

  it("should work in streaming mode", () => {
    const { container } = render(
      <Streamdown mode="streaming">
        {"> [!WARNING]\n> Be careful!"}
      </Streamdown>
    );

    const admonition = container.querySelector('[data-streamdown="admonition"]');
    expect(admonition).toBeTruthy();
    expect(admonition?.getAttribute("data-admonition-type")).toBe("warning");
  });
});

describe("admonition - component features", () => {
  it("should render the title text from translations", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE]\n> Content"}
      </Streamdown>
    );

    const title = container.querySelector('[data-streamdown="admonition-title"]');
    expect(title?.textContent).toContain("Note");
  });

  it("should render an icon in the title", () => {
    const { container } = render(
      <Streamdown mode="static">
        {"> [!NOTE]\n> Content"}
      </Streamdown>
    );

    const title = container.querySelector('[data-streamdown="admonition-title"]');
    const svg = title?.querySelector("svg");
    expect(svg).toBeTruthy();
  });

  it("should support custom translations", () => {
    const { container } = render(
      <Streamdown mode="static" translations={{ admonitionNote: "Nota" }}>
        {"> [!NOTE]\n> Content"}
      </Streamdown>
    );

    const title = container.querySelector('[data-streamdown="admonition-title"]');
    expect(title?.textContent).toContain("Nota");
  });

  it("should support component override", () => {
    const CustomAdmonition = (props: Record<string, unknown>) => (
      <div data-testid="custom-admonition">
        {props.children as React.ReactNode}
      </div>
    );

    const { container } = render(
      <Streamdown components={{ admonition: CustomAdmonition }} mode="static">
        {"> [!NOTE]\n> Custom content"}
      </Streamdown>
    );

    const custom = container.querySelector('[data-testid="custom-admonition"]');
    expect(custom).toBeTruthy();
    expect(custom?.textContent).toContain("Custom content");

    const defaultAdmonition = container.querySelector('[data-streamdown="admonition"]');
    expect(defaultAdmonition).toBeNull();
  });
});
