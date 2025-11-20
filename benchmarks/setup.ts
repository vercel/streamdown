// Suppress React act() warnings in benchmarks
// These warnings are expected in benchmarks because we're intentionally
// triggering many rapid re-renders to measure performance
const originalError = console.error;

beforeAll(() => {
  console.error = (...args: unknown[]) => {
    const message = typeof args[0] === "string" ? args[0] : "";
    // Suppress act() warnings
    if (message.includes("not wrapped in act(...)")) {
      return;
    }
    originalError(...args);
  };
});

afterAll(() => {
  console.error = originalError;
});
