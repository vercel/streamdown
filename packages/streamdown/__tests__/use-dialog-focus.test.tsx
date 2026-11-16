import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useDialogFocus } from "../lib/use-dialog-focus";

const Dialog = () => {
  const { dialogRef, initialFocusRef } = useDialogFocus(true);

  return (
    <div ref={dialogRef}>
      <button ref={initialFocusRef} type="button">
        Close
      </button>
      <button type="button">Last</button>
      <button tabIndex={-1} type="button">
        Not tabbable
      </button>
    </div>
  );
};

describe("useDialogFocus", () => {
  it("should skip controls with a negative tabIndex when wrapping", () => {
    render(<Dialog />);
    const last = screen.getByText("Last");

    last.focus();
    fireEvent.keyDown(last, { key: "Tab" });

    expect(document.activeElement).toBe(screen.getByText("Close"));
  });
});
