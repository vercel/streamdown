import { useIcons } from "../icon-context";
import { useCn } from "../prefix-context";

export const CodeBlockSkeleton = () => {
  const { Loader2Icon } = useIcons();
  const cn = useCn();
  return (
    <div
      className={cn(
        "w-full divide-y divide-border overflow-hidden rounded-xl border border-border"
      )}
    >
      <div className={cn("h-[46px] w-full bg-muted/80")} />
      <div className={cn("flex w-full items-center justify-center p-4")}>
        <Loader2Icon className={cn("size-4 animate-spin")} />
      </div>
    </div>
  );
};
