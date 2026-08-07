import { describe, expect, it } from "vitest";
import remend from "../src";

describe("tilde fences", () => {
  it("should not heal emphasis inside a complete tilde fence", () => {
    expect(remend("~~~\ncode with __stuff\n~~~\ndone")).toBe(
      "~~~\ncode with __stuff\n~~~\ndone"
    );
  });

  it("should not heal emphasis inside an open tilde fence", () => {
    expect(remend("~~~js\nx = a__b")).toBe("~~~js\nx = a__b");
  });

  it("should heal strikethrough after a complete tilde fence", () => {
    expect(remend("~~~\ncode\n~~~\nafter ~~open")).toBe(
      "~~~\ncode\n~~~\nafter ~~open~~"
    );
  });

  it("should treat a mid-line tilde run as strikethrough context, not a fence", () => {
    expect(remend("prose ~~struck~~ more prose __bold")).toBe(
      "prose ~~struck~~ more prose __bold__"
    );
  });
});

describe("fence opener position", () => {
  it("should recognize a fence indented up to three spaces", () => {
    expect(remend("   ```\n__code\n   ```\n__open")).toBe(
      "   ```\n__code\n   ```\n__open__"
    );
  });

  it("should treat mid-line triple backticks as inline code", () => {
    // A fence can only open at the start of a line, so a mid-line run is an
    // inline code span and heals by completing its closing run
    expect(remend("see ```inline code``")).toBe("see ```inline code```");
  });
});

describe("fence closer length", () => {
  it("should not close a fence with a shorter run", () => {
    // The ``` run is shorter than the ```` opener, so the fence is still
    // open and its content is not healed
    expect(remend("````\ncode\n```\nstill __code")).toBe(
      "````\ncode\n```\nstill __code"
    );
  });

  it("should close a fence with a longer run", () => {
    expect(remend("```\ncode\n````\nafter __bold")).toBe(
      "```\ncode\n````\nafter __bold__"
    );
  });
});

describe("fence info strings", () => {
  it("should not heal emphasis in an info string", () => {
    expect(remend("```python__hint\ncode")).toBe("```python__hint\ncode");
  });
});

describe("inline code span run lengths", () => {
  it("should complete a double-backtick span with a double run", () => {
    expect(remend("``code`")).toBe("``code``");
  });

  it("should complete only the missing part of the closing run", () => {
    expect(remend("``code")).toBe("``code``");
  });

  it("should leave a longer literal run inside an open span alone", () => {
    // The trailing run is longer than the opener, so appending backticks
    // could never close the span
    expect(remend("`a``")).toBe("`a``");
  });
});

describe("list-indented fences", () => {
  it("should recognize a fence indented inside a list item", () => {
    expect(remend("1.  Install:\n    ```bash\n    npm install foo")).toBe(
      "1.  Install:\n    ```bash\n    npm install foo"
    );
  });

  it("should not heal emphasis inside a list-indented fence", () => {
    expect(remend("- step\n  - nested\n    ```js\n    const x = a__b")).toBe(
      "- step\n  - nested\n    ```js\n    const x = a__b"
    );
  });
});

describe("CRLF line endings", () => {
  it("should recognize a fence opener on a CRLF line", () => {
    expect(remend("```js\r\nconst a = 1")).toBe("```js\r\nconst a = 1");
  });

  it("should close a CRLF fence and heal after it", () => {
    expect(remend("```\r\ncode\r\n```\r\n__open")).toBe(
      "```\r\ncode\r\n```\r\n__open__"
    );
  });
});

describe("spans across paragraphs", () => {
  it("should leave an unmatched run literal once its paragraph ends", () => {
    expect(remend("use ``` to open a block\n\nmore **bold streaming")).toBe(
      "use ``` to open a block\n\nmore **bold streaming**"
    );
  });

  it("should still complete an open span in the last paragraph", () => {
    expect(remend("intro\n\nrun `npm i")).toBe("intro\n\nrun `npm i`");
  });
});
