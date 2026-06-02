"use client";
import { HTMLAttributes, forwardRef } from "react";
import { VariantProps } from "class-variance-authority";
import { dropdownRootCVA } from "./dropdownRootCVA";
import { cn } from "@/ds/utils/cnMerge";

export interface dropdownRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dropdownRootCVA> {
  children: React.ReactNode;
  buttonDrop: React.ReactNode;
  ref?: React.Ref<HTMLDivElement>;
  active: boolean;
  bgTransparent?: boolean;
  boxClassname?: string;
}

const DropdownRoot = forwardRef<HTMLDivElement, dropdownRootProps>(
  (
    {
      variant,
      className,
      children,
      active,
      buttonDrop,
      bgTransparent,
      boxClassname,
      ...restProps
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          dropdownRootCVA({
            className,
            variant,
          })
        )}
        {...restProps}
      >
        {buttonDrop}
        {/* bg-GrayScale-TextIcon-Body */}
        <div
          className={`${active ? "" : "hidden"} dropdown-fade-in-out absolute ${
            variant === "botBotRight" ? "left-0" : "right-0"
          } z-10 mt-2 w-fit min-w-[24rem] origin-top-right rounded-[1rem] ${
            bgTransparent
              ? "bg-transparent outline-none"
              : "bg-[#F8F9FA] shadow-lg focus:outline-none py-2 border-[1px] border-[#E4E4E4]"
          } ${boxClassname}`}
          role="menu"
          aria-orientation="vertical"
          aria-labelledby="menu-button"
          tabIndex={-1}
        >
          <ul className={"flex flex-col gap-0 h-fit"}>{children}</ul>
        </div>
      </div>
    );
  }
);
DropdownRoot.displayName = "CommonDropdownRoot";

export { DropdownRoot };
