import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";
interface PanelHindProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const ChatMessageHeader = ({
  children,
  className,
  ...restProps
}: PanelHindProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        "h-[var(--header-height)] w-full bg-DSHeaderBackground top-0 z-30 px-6 flex flex-row items-center justify-between sticky border-b-[0.1rem] border-[#E4E4E4]",
        className
      )}
    >
      {children}
    </div>
  );
};

export { ChatMessageHeader };
