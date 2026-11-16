import { describe, expect, it } from "vitest";
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

  it("uses the content majority when an RTL sentence starts with an English identifier", () => {
    expect(
      detectTextDirection("React یک کتابخانه جاوااسکریپت بسیار محبوب است.")
    ).toBe("rtl");
  });

  it("does not let fenced code skew the direction of surrounding prose", () => {
    expect(
      detectTextDirection(
        "این یک نمونه است.\n\n```js\nconst example = true;\n```"
      )
    ).toBe("rtl");
  });

  it("handles Thaana script", () => {
    expect(detectTextDirection("ދިވެހި")).toBe("rtl");
  });

  it("handles inline code", () => {
    expect(detectTextDirection("`code` مرحبا")).toBe("rtl");
  });

  it("does not count Arabic digits as letters", () => {
    expect(detectTextDirection("Call ٠٥٠١٢٣٤٥٦٧ today")).toBe("ltr");
  });

  it("does not count Persian digits as letters", () => {
    expect(detectTextDirection("Invoice ۱۴۰۳/۰۵/۲۱")).toBe("ltr");
  });

  it("does not count Hebrew vowel points as letters", () => {
    expect(detectTextDirection("Read בְּרֵאשִׁית aloud")).toBe("ltr");
  });

  it("does not count Arabic vowel marks as letters", () => {
    expect(detectTextDirection("Word كِتَابٌ")).toBe("ltr");
  });

  it("gives text the same direction with and without vowel marks", () => {
    expect(detectTextDirection("Word كِتَابٌ")).toBe(
      detectTextDirection("Word كتاب")
    );
  });

  it("does not treat a leading Arabic digit as the first strong character", () => {
    expect(detectTextDirection("٣ abc אבג")).toBe("ltr");
  });

  it("returns rtl for pointed text with no Latin letters", () => {
    expect(detectTextDirection("בְּרֵאשִׁית")).toBe("rtl");
    expect(detectTextDirection("كِتَابٌ")).toBe("rtl");
  });

  it("returns rtl for an RTL sentence with digits in it", () => {
    expect(detectTextDirection("السعر ٢٥ ريال")).toBe("rtl");
  });

  it("returns rtl for Arabic digits with no letters", () => {
    expect(detectTextDirection("٢٠٢٤")).toBe("rtl");
    expect(detectTextDirection("۲۵٪")).toBe("rtl");
  });
});
