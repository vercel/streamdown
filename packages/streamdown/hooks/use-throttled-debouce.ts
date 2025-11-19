import { useEffect, useRef, useState } from "react";

export const useThrottledDebounce = <T>(
  value: T,
  throttleMs = 200,
  debounceMs = 50
) => {
  const [processedValue, setProcessedValue] = useState(value);
  const lastRunTime = useRef(0);
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastRun = now - lastRunTime.current;

    // Clear any pending debounce
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    // If enough time has passed, run immediately (throttle)
    if (timeSinceLastRun >= throttleMs) {
      setProcessedValue(value);
      lastRunTime.current = now;
    } else {
      // Otherwise, debounce it
      timeoutRef.current = window.setTimeout(() => {
        setProcessedValue(value);
        lastRunTime.current = Date.now();
      }, debounceMs);
    }

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [value, throttleMs, debounceMs]);

  return processedValue;
};
