import { cn } from "@/ds/utils/cnMerge";
import { type HTMLAttributes } from "react";
interface HeaderRootProps extends HTMLAttributes<HTMLHeadingElement> {
  children?: React.ReactNode;
}

const HeaderRoot = ({ children, className, ...restProps }: HeaderRootProps) => {
  return (
    <header
      {...restProps}
      className={cn(
        "h-[var(--header-height)] w-full fixed top-0 left-0 z-30 _pading_section flex flex-col items-center justify-between bg-DSHeaderBackground",
        className
      )}
    >
      {children}
    </header>
  );
};

export { HeaderRoot };
