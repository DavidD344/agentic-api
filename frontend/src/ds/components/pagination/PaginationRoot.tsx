"use client";
import { type HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";

interface PaginationRootProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  nextFunction: () => void;
  underFunction: () => void;
}

const PaginationRoot = ({
  children,
  className,
  nextFunction,
  underFunction,
  ...restProps
}: PaginationRootProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        " w-fit h-fit flex flex-row justify-center items-center ",
        className
      )}
    >
      <div
        onClick={() => {
          underFunction();
        }}
        className="w-8 h-8 flex justify-center items-center  cursor-pointer rounded-[0.3rem]  "
      >
        {/* <ChevronLeftIcon primaryColor="#3e424b" size="large" label="" /> */}
      </div>
      <div className=" overflow-x-scroll max-w-[60vw] md:max-w-[42rem] h-fit block whitespace-nowrap not_show_scrollbar">
        {children}
      </div>
      <div
        onClick={() => {
          nextFunction();
        }}
        className="w-8 h-8 flex justify-center items-center cursor-pointer rounded-[0.3rem]"
      >
        {/* <ChevronRightIcon primaryColor="#3e424b" size="large" label="" /> */}
      </div>
    </div>
  );
};

export { PaginationRoot };
