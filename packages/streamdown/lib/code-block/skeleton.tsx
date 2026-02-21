import { useIcons } from "../icon-context";

export const CodeBlockSkeleton = () => {
  const { Loader2Icon } = useIcons();
  return (
  <div className="w-full divide-y divide-border overflow-hidden rounded-xl border border-border">
    <div className="h-[46px] w-full bg-muted/80" />
    <div className="flex w-full items-center justify-center p-4">
      <Loader2Icon className="size-4 animate-spin" />
    </div>
  </div>
  );
};
