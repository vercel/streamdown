import "react";

// next/og supports experimental Tailwind via `tw`, but the React HTMLAttributes
// augmentation is not always picked up during typechecking.
declare module "react" {
  interface HTMLAttributes<T> {
    tw?: string;
  }
}
