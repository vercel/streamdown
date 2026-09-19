import { type ComponentProps, createElement } from "react";
import {
  type DefaultComponents,
  defaultComponents,
  type ExtraProps,
  Streamdown,
} from "../index";

// Compile-time checks only — referenced so values are "used".
const DefaultH2 = defaultComponents.h2;
const DefaultA = defaultComponents.a;
const DefaultCode = defaultComponents.code;
const _map: DefaultComponents = defaultComponents;

const _styleOverride = {
  h2: (props: ComponentProps<"h2"> & ExtraProps) =>
    createElement(DefaultH2, {
      ...props,
      className: `${props.className ?? ""} text-blue-500`,
    }),
};

function AOverride(props: ComponentProps<"a"> & ExtraProps) {
  if (props.href?.startsWith("/internal")) {
    return createElement("a", { ...props, className: "text-emerald-600" });
  }
  return createElement(DefaultA, props);
}

const _conditional = { a: AOverride };

// Valid Streamdown props
createElement(Streamdown, { components: _styleOverride }, "## Hello");
createElement(Streamdown, { components: _conditional }, "[x](/internal)");

// Ensure JSX form types too
const _jsx = createElement(DefaultH2, { className: "x" }, "y");
const _jsxA = createElement(DefaultA, { href: "https://example.com" }, "z");

export { DefaultCode, _map, _styleOverride, _conditional, _jsx, _jsxA };
