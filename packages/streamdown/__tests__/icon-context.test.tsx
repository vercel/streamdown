import { render, screen } from "@testing-library/react";
import type { SVGProps } from "react";
import { describe, expect, it } from "vitest";
import {
  defaultIcons,
  IconProvider,
  useIcons,
} from "../lib/icon-context";

const CustomCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg data-testid="custom-check" {...props}>
    <circle r="5" />
  </svg>
);

const IconConsumer = ({ iconName }: { iconName: keyof typeof defaultIcons }) => {
  const icons = useIcons();
  const Icon = icons[iconName];
  return <Icon data-testid="rendered-icon" />;
};

describe("IconProvider", () => {
  it("provides default icons when no overrides are given", () => {
    const { container } = render(
      <IconProvider>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    // Default CheckIcon has a <path> child, not <circle>
    expect(svg?.querySelector("path")).toBeTruthy();
    expect(svg?.querySelector("circle")).toBeFalsy();
  });

  it("overrides a specific icon when provided", () => {
    const { container } = render(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    const svg = container.querySelector("svg");
    expect(svg).toBeTruthy();
    // Custom icon renders a <circle>, not a <path>
    expect(svg?.querySelector("circle")).toBeTruthy();
    expect(svg?.querySelector("path")).toBeFalsy();
  });

  it("keeps non-overridden icons as defaults", () => {
    const { container } = render(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CopyIcon" />
      </IconProvider>
    );

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    // CopyIcon should still be the default (has a <path>)
    expect(svg?.querySelector("path")).toBeTruthy();
  });

  it("falls back to defaults when icons prop is undefined", () => {
    const { container } = render(
      <IconProvider icons={undefined}>
        <IconConsumer iconName="DownloadIcon" />
      </IconProvider>
    );

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    expect(svg?.querySelector("path")).toBeTruthy();
  });
});

describe("useIcons", () => {
  it("returns default icons outside of a provider", () => {
    const { container } = render(<IconConsumer iconName="CheckIcon" />);

    const svg = container.querySelector("[data-testid='rendered-icon']");
    expect(svg).toBeTruthy();
    expect(svg?.querySelector("path")).toBeTruthy();
  });
});
