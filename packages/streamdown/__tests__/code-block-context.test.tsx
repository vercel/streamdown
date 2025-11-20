import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CodeBlockContext, useCodeBlockContext } from "../lib/code-block/context";

describe("CodeBlockContext", () => {
  it("should provide code value through context", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    render(
      <CodeBlockContext.Provider value={{ code: "test code" }}>
        <TestComponent />
      </CodeBlockContext.Provider>
    );

    expect(capturedCode).toBe("test code");
  });

  it("should work with default context value when no provider is used", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    // Render without provider - should use default context value
    render(<TestComponent />);

    // The default value from createContext is { code: "" }
    expect(capturedCode).toBe("");
  });

  it("should have default empty code value", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    // Render with default context value
    render(
      <CodeBlockContext.Provider value={{ code: "" }}>
        <TestComponent />
      </CodeBlockContext.Provider>
    );

    expect(capturedCode).toBe("");
  });

  it("should update when context value changes", () => {
    let capturedCode = "";

    const TestComponent = () => {
      const { code } = useCodeBlockContext();
      capturedCode = code;
      return <div>{code}</div>;
    };

    const { rerender } = render(
      <CodeBlockContext.Provider value={{ code: "initial" }}>
        <TestComponent />
      </CodeBlockContext.Provider>
    );

    expect(capturedCode).toBe("initial");

    rerender(
      <CodeBlockContext.Provider value={{ code: "updated" }}>
        <TestComponent />
      </CodeBlockContext.Provider>
    );

    expect(capturedCode).toBe("updated");
  });
});
