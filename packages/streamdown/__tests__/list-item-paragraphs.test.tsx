import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Streamdown } from "../index";

describe("list item paragraph wrapping", () => {
  it("does not keep paragraph wrappers for loose list items", () => {
    const markdown = `
## Test

- hello

- world
`;
    const { container } = render(<Streamdown>{markdown}</Streamdown>);

    const items = container.querySelectorAll('[data-streamdown="list-item"]');

    expect(items).toHaveLength(2);
    for (const item of items) {
      expect(item.querySelector("p")).toBeNull();
    }
  });
});
