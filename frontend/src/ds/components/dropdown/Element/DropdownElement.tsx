"use client";
import { cn } from "@/ds/utils/cnMerge";
import { HTMLAttributes } from "react";

interface DropdownElementProps extends HTMLAttributes<HTMLLIElement> {
  children: React.ReactNode;
}

const DropdownElement = ({
  className,
  children,
  ...restProps
}: DropdownElementProps) => {
  return (
    <li
      tabIndex={-1}
      className={cn(
        " block py-2 px-4 whitespace-nowrap w-full cursor-pointer transition-colors duration-300",
        className
      )}
      {...restProps}
    >
      {children}
    </li>
  );
};
export { DropdownElement };
