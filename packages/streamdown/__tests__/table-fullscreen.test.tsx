import { fireEvent, render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown, StreamdownContext } from "../index";

const markdownWithTable = `
| Name | Age |
|------|-----|
| Alice | 30 |
| Bob | 25 |
`;

describe("TableFullscreenButton", () => {
  it("should render fullscreen button when controls are enabled", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeTruthy();
  });

  it("should not render fullscreen button when controls are false", () => {
    const { container } = render(
      <Streamdown controls={false}>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should not render fullscreen button when table fullscreen is false", () => {
    const { container } = render(
      <Streamdown controls={{ table: { fullscreen: false } }}>
        {markdownWithTable}
      </Streamdown>
    );

    const btn = container.querySelector('button[title="View fullscreen"]');
    expect(btn).toBeFalsy();
  });

  it("should open fullscreen overlay on click", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();

    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();
  });

  it("should close fullscreen overlay on close button click", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]'
    ) as HTMLButtonElement;
    expect(closeBtn).toBeTruthy();

    fireEvent.click(closeBtn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeFalsy();
  });

  it("should close fullscreen overlay on Escape key", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();

    fireEvent.keyDown(document, { key: "Escape" });

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeFalsy();
  });

  it("should lock body scroll when fullscreen is open", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    expect(document.body.style.overflow).toBe("hidden");

    const closeBtn = document.querySelector(
      'button[title="Exit fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(closeBtn);

    expect(document.body.style.overflow).toBe("");
  });

  it("should disable fullscreen button when isAnimating", () => {
    const { container } = render(
      <Streamdown isAnimating={true}>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    expect(btn).toBeTruthy();
    expect(btn.disabled).toBe(true);
  });

  it("should render table content inside fullscreen overlay", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const table = overlay?.querySelector('[data-streamdown="table"]');
    expect(table).toBeTruthy();
  });

  it("should show copy and download controls in fullscreen", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    const downloadBtn = overlay?.querySelector(
      'button[title="Download table"]'
    );
    expect(copyBtn).toBeTruthy();
    expect(downloadBtn).toBeTruthy();
  });

  it("should not close fullscreen when clicking controls inside overlay", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    expect(overlay).toBeTruthy();

    const copyBtn = overlay?.querySelector(
      'button[title="Copy table"]'
    ) as HTMLButtonElement;
    expect(copyBtn).toBeTruthy();
    fireEvent.click(copyBtn);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
  });

  it("should not close fullscreen when clicking table content", () => {
    const { container } = render(
      <Streamdown>{markdownWithTable}</Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const table = overlay?.querySelector(
      '[data-streamdown="table"]'
    ) as HTMLTableElement;
    expect(table).toBeTruthy();
    fireEvent.click(table);

    expect(
      document.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
  });

  it("should hide copy in fullscreen when table copy is false", () => {
    const { container } = render(
      <Streamdown controls={{ table: { copy: false } }}>
        {markdownWithTable}
      </Streamdown>
    );

    const btn = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(btn);

    const overlay = document.querySelector(
      '[data-streamdown="table-fullscreen"]'
    );
    const copyBtn = overlay?.querySelector('button[title="Copy table"]');
    expect(copyBtn).toBeFalsy();
  });
});
