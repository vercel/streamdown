// Mock SVG methods not available in jsdom
Object.defineProperty(SVGElement.prototype, "getBBox", {
  value: () => ({
    x: 0,
    y: 0,
    width: 100,
    height: 50,
  }),
  writable: true,
});

Object.defineProperty(SVGElement.prototype, "getComputedTextLength", {
  value: () => 100,
  writable: true,
});
