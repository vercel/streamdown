import { describe, it, expect } from "vitest";
import { detectTextDirection } from "../lib/detect-direction";

describe("detectTextDirection", () => {
  it("returns ltr for English text", () => {
    expect(detectTextDirection("Hello world")).toBe("ltr");
  });

  it("returns rtl for Arabic text", () => {
    expect(detectTextDirection("مرحبا بالعالم")).toBe("rtl");
  });

  it("returns rtl for Hebrew text", () => {
    expect(detectTextDirection("שלום עולם")).toBe("rtl");
  });

  it("skips markdown heading syntax", () => {
    expect(detectTextDirection("## مرحبا")).toBe("rtl");
  });

  it("skips leading punctuation and digits", () => {
    expect(detectTextDirection("123. مرحبا")).toBe("rtl");
  });

  it("handles bold/italic markdown", () => {
    expect(detectTextDirection("**שלום**")).toBe("rtl");
  });

  it("returns ltr for empty string", () => {
    expect(detectTextDirection("")).toBe("ltr");
  });

  it("returns ltr for numbers only", () => {
    expect(detectTextDirection("12345")).toBe("ltr");
  });

  it("returns ltr for mixed starting with Latin", () => {
    expect(detectTextDirection("Hello مرحبا")).toBe("ltr");
  });

  it("returns rtl for mixed starting with Arabic", () => {
    expect(detectTextDirection("مرحبا Hello")).toBe("rtl");
  });

  it("handles Thaana script", () => {
    expect(detectTextDirection("ދިވެހި")).toBe("rtl");
  });

  it("handles inline code", () => {
    expect(detectTextDirection("`code` مرحبا")).toBe("rtl");
  });
});
