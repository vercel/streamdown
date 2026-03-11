import { render } from "@testing-library/react";
import type { SVGProps } from "react";
import { describe, expect, it } from "vitest";
import { type defaultIcons, IconProvider, useIcons } from "../lib/icon-context";

const CustomCheckIcon = (props: SVGProps<SVGSVGElement>) => (
  <svg data-testid="custom-check" {...props}>
    <title>Check icon</title>
    <circle r="5" />
  </svg>
);

const IconConsumer = ({
  iconName,
}: {
  iconName: keyof typeof defaultIcons;
}) => {
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

describe("IconProvider rerender / shallowEqual coverage", () => {
  it("recalculates value when icons prop changes to a different component", () => {
    const AltCheckIcon = (props: SVGProps<SVGSVGElement>) => (
      <svg data-testid="alt-check" {...props}>
        <title>Alt check</title>
        <rect width="10" height="10" />
      </svg>
    );

    const { container, rerender } = render(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    // Initially shows custom icon (circle)
    expect(container.querySelector("circle")).toBeTruthy();

    // Rerender with a different icon component → triggers shallowEqual mismatch (value changed)
    rerender(
      <IconProvider icons={{ CheckIcon: AltCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    expect(container.querySelector("rect")).toBeTruthy();
    expect(container.querySelector("circle")).toBeFalsy();
  });

  it("recalculates value when icons prop changes from object to undefined", () => {
    const { container, rerender } = render(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    // Custom icon
    expect(container.querySelector("circle")).toBeTruthy();

    // Rerender with undefined → triggers !(a && b) branch in shallowEqual
    rerender(
      <IconProvider icons={undefined}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    // Should fall back to default (path, no circle)
    expect(container.querySelector("circle")).toBeFalsy();
    expect(container.querySelector("path")).toBeTruthy();
  });

  it("recalculates value when icons prop changes from undefined to object", () => {
    const { container, rerender } = render(
      <IconProvider icons={undefined}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    // Default icon
    expect(container.querySelector("path")).toBeTruthy();

    // Rerender with icons → triggers !(a && b) branch (a is undefined, b is object)
    rerender(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    expect(container.querySelector("circle")).toBeTruthy();
  });

  it("detects key count mismatch in shallowEqual", () => {
    const AnotherIcon = (props: SVGProps<SVGSVGElement>) => (
      <svg {...props}>
        <title>Another</title>
      </svg>
    );

    const { container, rerender } = render(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon }}>
        <IconConsumer iconName="CopyIcon" />
      </IconProvider>
    );

    // Default CopyIcon
    expect(container.querySelector("path")).toBeTruthy();

    // Rerender with different key count → triggers keysA.length !== keysB.length
    rerender(
      <IconProvider icons={{ CheckIcon: CustomCheckIcon, CopyIcon: AnotherIcon }}>
        <IconConsumer iconName="CopyIcon" />
      </IconProvider>
    );

    // CopyIcon is now overridden
    expect(container.querySelector("[data-testid='rendered-icon']")).toBeTruthy();
  });

  it("preserves memoized value when same icons reference is passed", () => {
    const icons = { CheckIcon: CustomCheckIcon };

    const { container, rerender } = render(
      <IconProvider icons={icons}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    expect(container.querySelector("circle")).toBeTruthy();

    // Rerender with the exact same reference → shallowEqual returns true (a === b)
    rerender(
      <IconProvider icons={icons}>
        <IconConsumer iconName="CheckIcon" />
      </IconProvider>
    );

    expect(container.querySelector("circle")).toBeTruthy();
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
