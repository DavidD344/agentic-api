import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";

interface PanelRootProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
  active: boolean;
}

const ChatMessagePanel = ({
  children,
  className,
  active,
  ...restProps
}: PanelRootProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        `h-[calc(100vh-var(--header-height))] ${
          active ? "left-0" : "-left-[26.4rem]"
        } w-[28rem] fixed top-[var(--header-height)] transition-all duration-500 ease-in-out z-20 flex flex-col items-start justify-start bg-[#F8F9FA] border-r border-[#E4E4E4]`,
        className
      )}
    >
      {children}
    </div>
  );
};

export { ChatMessagePanel };
