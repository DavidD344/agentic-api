"use client";
import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";

interface PanelHindProps extends HTMLAttributes<HTMLDivElement> {
  activePanel: boolean;
  children?: React.ReactNode;
  footChildren?: React.ReactNode;
}

const ChatMessageHindFill = ({
  children,
  className,
  activePanel,
  footChildren,
  ...restProps
}: PanelHindProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        `${
          activePanel ? "md:pl-[calc(28rem)]" : ""
        }   pr-0 w-screen h-[calc(100vh-var(--header-height))] transition-all duration-500  ease-in-out`,
        className
      )}
    >
      <div className={cn("w-full relative h-full", activePanel ? "" : "")}>
        {children}
      </div>
      {footChildren}
    </div>
  );
};

export { ChatMessageHindFill };
