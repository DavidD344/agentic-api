"use client";
import { Caption } from "@/ds/typography/Caption/Caption";
import { cn } from "@/ds/utils/cnMerge";

import { VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { flagMessageCVA } from "./flagMessageCVA";

interface FlagMessageProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof flagMessageCVA> {
  children?: React.ReactNode;
  title?: string;
}

const FlagMessage = ({
  children,
  variant,
  className,
  title,

  ...restProps
}: FlagMessageProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        flagMessageCVA({
          className,
          variant,
        })
      )}
    >
      {/* {variant === "success" && (
        <CheckCircleIcon label="" primaryColor="#00643A" size="small" />
      )}

      {variant === "error" && (
        <WarningIcon label="" primaryColor="#B70C1D" size="small" />
      )}
      {variant === "info" && (
        <InfoIcon label="" primaryColor="#0055CC" size="small" />
      )} */}
      <div className="flex flex-col justify-start items-start gap-y-2 ">
        {title && (
          <Caption weight={"Bold"} className="">
            {title}
          </Caption>
        )}
        {variant === "none" ? (
          <br />
        ) : (
          <Caption weight={"Light"}>{children}</Caption>
        )}
      </div>
    </div>
  );
};
export { FlagMessage };
