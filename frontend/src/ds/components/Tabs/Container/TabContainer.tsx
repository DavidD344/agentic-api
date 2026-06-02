"use client";
import { type HTMLAttributes } from "react";

import { cn } from "@/ds/utils/cnMerge";

interface TabDefaultProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const TabContainer = ({
  children,
  className,
  ...restProps
}: TabDefaultProps) => {
  return (
    <div className="overflow-x-auto not_show_scrollbar">
      <div
        {...restProps}
        className={cn("flex flex-row justify-between items-center ", className)}
      >
        {children}
      </div>
    </div>
  );
};
export { TabContainer };
