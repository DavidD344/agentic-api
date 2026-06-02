import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";

const DotText = ({
  className,
  ...restProps
}: HTMLAttributes<HTMLDivElement>) => {
  return (
    <span {...restProps} className={cn("w-fit h-fit", className)}>
      •
    </span>
  );
};
export { DotText };
