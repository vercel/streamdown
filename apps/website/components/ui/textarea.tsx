import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

// App-owned since Geistdocs v2 no longer exports `components/textarea`.
export const Textarea = ({ className, ...props }: ComponentProps<"textarea">) => (
  <textarea
    className={cn(
      "field-sizing-content flex min-h-16 w-full rounded-md border border-gray-alpha-400 bg-transparent px-3 py-2 text-base shadow-xs outline-none transition-[color,box-shadow] placeholder:text-gray-800 focus-visible:border-gray-600 focus-visible:ring-[3px] focus-visible:ring-gray-600/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-red-800 aria-invalid:ring-red-800/20 md:text-sm dark:bg-gray-alpha-400/30 dark:aria-invalid:ring-red-800/40",
      className
    )}
    data-slot="textarea"
    {...props}
  />
);
