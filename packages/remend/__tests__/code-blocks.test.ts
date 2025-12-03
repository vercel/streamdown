import { describe, expect, it } from "vitest";
import remend from "../src";

describe("code block handling", () => {
  it("should handle incomplete multiline code blocks", () => {
    expect(remend("```javascript\nconst x = 5;")).toBe(
      "```javascript\nconst x = 5;"
    );
    expect(remend("```\ncode here")).toBe("```\ncode here");
  });

  it("should handle complete multiline code blocks", () => {
    const text = "```javascript\nconst x = 5;\n```";
    expect(remend(text)).toBe(text);
  });

  it("should handle code blocks with language and incomplete content", () => {
    expect(remend("```python\ndef hello():")).toBe("```python\ndef hello():");
  });

  it("should handle nested backticks inside code blocks", () => {
    const text = "```\nconst str = `template`;\n```";
    expect(remend(text)).toBe(text);
  });

  it("should handle incomplete code blocks at end of chunked response", () => {
    expect(remend("Some text\n```js\nconsole.log")).toBe(
      "Some text\n```js\nconsole.log"
    );
  });

  it("should handle code blocks with trailing content", () => {
    const text = "```\ncode\n```\nMore text";
    expect(remend(text)).toBe(text);
  });

  it("should handle complete code blocks ending with triple backticks on newline", () => {
    const text =
      '```python\ndef greet(name):\n    return f"Hello, {name}!"\n```';
    expect(remend(text)).toBe(text);
  });

  it("should handle complete code blocks with trailing newline after closing backticks", () => {
    const text =
      '```python\ndef greet(name):\n    return f"Hello, {name}!"\n```\n';
    expect(remend(text)).toBe(text);
  });

  it("should not add extra characters to complete simple code block", () => {
    // Bug report: This was being rendered with extra characters at the end
    const text =
      "```\nSimple code block\nwith multiple lines\nand some special characters: !@#$%^&*()\n```";
    expect(remend(text)).toBe(text);
  });

  it("should not add extra characters to complete Python code block with underscores and asterisks", () => {
    // Bug report: This was being rendered with **_ appended
    const text =
      '```python\ndef hello_world():\n    """A simple function"""\n    name = "World"\n    print(f"Hello, {name}!")\n    \n    # List comprehension\n    numbers = [x**2 for x in range(10) if x % 2 == 0]\n    return numbers\n\nclass TestClass:\n    def __init__(self, value):\n        self.value = value\n```';
    expect(remend(text)).toBe(text);
  });

  it("should not add backticks when code block ends properly", () => {
    // This is the exact case from Grok
    const grokOutput =
      '```python def greet(name): return f"Hello, {name}!"\n```';
    expect(remend(grokOutput)).toBe(grokOutput);
  });

  it("should handle multiple complete code blocks with newlines", () => {
    const text = "```js\ncode1\n```\n\n```python\ncode2\n```";
    expect(remend(text)).toBe(text);
  });

  it("should correctly handle code on same line as opening backticks with closing on newline", () => {
    // This was causing issues - being treated as inline when it should be multiline
    const text = '```python def greet(name): return f"Hello, {name}!"\n```';
    expect(remend(text)).toBe(text);

    // Should NOT be treated as inline triple backticks
    const result = remend(text);
    expect(result).not.toContain("````"); // Should not add extra backticks
  });

  it("should only treat truly inline triple backticks as inline", () => {
    // This SHOULD be treated as inline (no newlines)
    const inline = "```python code```";
    expect(remend(inline)).toBe(inline);

    // This should NOT be treated as inline (has newline)
    const multiline = "```python code\n```";
    expect(remend(multiline)).toBe(multiline);
  });

  it("should not treat brackets inside complete code blocks as incomplete links", () => {
    const text = `Here's some code:
\`\`\`javascript
const arr = [1, 2, 3];
console.log(arr[0]);
\`\`\`
Done with code block.`;

    const result = remend(text);
    expect(result).not.toContain("streamdown:incomplete-link");
    expect(result).toBe(text);
  });

  it("should still detect actual incomplete links outside of code blocks", () => {
    const text = `Here's a code block:
\`\`\`bash
echo "test"
\`\`\`
And here's an [incomplete link`;

    const result = remend(text);
    expect(result).toContain("streamdown:incomplete-link");
    expect(result).toBe(`Here's a code block:
\`\`\`bash
echo "test"
\`\`\`
And here's an [incomplete link](streamdown:incomplete-link)`);
  });

  it("should not add incomplete-link marker after complete code blocks - #227", () => {
    const text_content = `Precisely.

When full-screen TUI applications like **Vim**, **less**, or **htop** start, they switch the terminal into what's called the **alternate screen buffer**—a second, temporary display area separate from the main scrollback buffer.

### How it works
They send ANSI escape sequences such as:
\`\`\`bash
# Enter alternate screen buffer
echo -e "\\\\e[?1049h"

# Exit (back to normal buffer)
echo -e "\\\\e[?1049l"
\`\`\`

- \`\\\\e[?1049h\` — activates the alternate screen.
- \`\\\\e[?1049l\` — deactivates it and restores the previous view.

While in this mode:
- The "scrollback" (your regular terminal history) is hidden.
- The program gets a fresh, empty screen to draw on.
- When the program exits, the screen restores exactly as it was before.

### tmux behavior
\`tmux\` respects these escape sequences by default. When apps use the alternate buffer, tmux holds that screen separately from the main one. That's why, when you scroll in tmux during Vim, you don't see your shell history—you have to leave Vim first.

If someone wants to **disable** this behavior (so the app draws on the main screen and you can scroll back freely), they can set:
\`\`\`bash
set -g terminal-overrides 'xterm*:smcup@:rmcup@'
\`\`\`
in their \`~/.tmux.conf\`, which disables use of the alternate buffer entirely.

Would you like me to show how to conditionally toggle that behavior per app or session?`;

    const result = remend(text_content);

    // Should NOT contain incomplete-link marker
    expect(result).not.toContain("streamdown:incomplete-link");
    // Should preserve original content
    expect(result).toBe(text_content);
  });
});
