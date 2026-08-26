import { fireEvent, render } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { Streamdown } from "../index";
import { resolvePortalTarget } from "../lib/portal";

const markdownWithTable = `
| Name | Age |
|------|-----|
| Alice | 30 |
`;

describe("portal target", () => {
  it("should fall back to document.body when the portal getter returns null", () => {
    expect(resolvePortalTarget(() => null)).toBe(document.body);
  });

  it("should not resolve the portal target during server rendering", () => {
    const getPortal = vi.fn(() => document.body);

    renderToString(<Streamdown portal={getPortal}>Content</Streamdown>);

    expect(getPortal).not.toHaveBeenCalled();
  });

  it("should treat portal as an initializing prop", () => {
    const firstRoot = document.createElement("div");
    const secondRoot = document.createElement("div");
    document.body.append(firstRoot, secondRoot);

    const { container, rerender, unmount } = render(
      <Streamdown portal={firstRoot}>{markdownWithTable}</Streamdown>
    );

    rerender(<Streamdown portal={secondRoot}>{markdownWithTable}</Streamdown>);

    const button = container.querySelector(
      'button[title="View fullscreen"]'
    ) as HTMLButtonElement;
    fireEvent.click(button);

    expect(
      firstRoot.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeTruthy();
    expect(
      secondRoot.querySelector('[data-streamdown="table-fullscreen"]')
    ).toBeNull();

    unmount();
    firstRoot.remove();
    secondRoot.remove();
  });
});
