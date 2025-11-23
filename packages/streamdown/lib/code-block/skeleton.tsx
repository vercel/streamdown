import { Loader2Icon } from "lucide-react";

export const CodeBlockSkeleton = () => (
  <div className="w-full divide-y divide-border overflow-hidden rounded-xl border border-border">
    <div className="h-[46px] w-full bg-muted/80" />
    <div className="flex w-full items-center justify-center p-4">
      <Loader2Icon className="size-4 animate-spin" />
    </div>
  </div>
);
