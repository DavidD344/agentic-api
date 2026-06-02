import { cn } from "@/ds/utils/cnMerge";
import { HTMLAttributes } from "react";

interface BarLoadingProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const BarLoading = ({ className, ...restProps }: BarLoadingProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        "fixed top-[calc(var(--header-height))] z-50 left-0 w-full h-0.5 bg-B200 flex flex-row justify-center items-center",
        className
      )}
      role="status"
    >
      <div className="h-full bg-DSGlobalPrimary absolute animate-loading" />
    </div>
  );
};

export { BarLoading };
