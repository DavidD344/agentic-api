"use client";
import { ChildAccordion } from "@/ds/animations/ChildAccordion/ChildAccordion";
import { H6 } from "@/ds/typography/H6/H6";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { InputHTMLAttributes, JSX, forwardRef } from "react";
import { NoteMessage } from "../../noteMessage/NoteMessage";
import { inputDefaultCVA } from "./inputDefaultCVA";

export interface InputDefaultProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputDefaultCVA> {
  rightIcon?: JSX.Element;
  leftIcon?: JSX.Element;

  ref?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  message?: string | undefined;
  label?: string;
  labelRequired?: boolean;
}

const InputDefault = forwardRef<HTMLInputElement, InputDefaultProps>(
  (
    {
      variant,
      scale,
      type,
      label,
      labelRequired,
      note,
      message,
      disabled,
      className,
      leftIcon,
      rightIcon,
      id,
      variantColor,
      ...restProps
    },
    ref
  ) => {
    return (
      <div className="h-fit w-full">
        {label && (
          <label htmlFor={id}>
            <H6 weight={"Regular"} className={cn("mb-3",variantColor === "black" || variantColor ===  undefined? 'text-[#F5F5F5]' : 'text-DSGlobalPrimary')}>
              {label} {labelRequired && <span className="text-R800">*</span>}
            </H6>
          </label>
        )}
        <div
          className={`h-fit w-full ${
            (variant === "left" ||
              variant === "right" ||
              variant === "twoSidesIcon" ||
              variant === "searchInput") &&
            "relative"
          }`}
        >
          {(variant === "right" || variant === "twoSidesIcon") && (
            <span
              className={`absolute top-0 right-0 w-10.2 ${
                scale === "small" ? "h-9.4" : "h-10.6"
              } [&>div]:flex [&>div]:justify-center [&>div]:items-center [&>div]:h-full [&>div]:w-full z-10 ${
                disabled ? "" : "[&>div]:cursor-pointer"
              }`}
            >
              {rightIcon}
            </span>
          )}
          {(variant === "left" ||
            variant === "twoSidesIcon" ||
            variant === "searchInput") && (
            <span
              className={`absolute top-0 left-0 w-10.2 ${
                scale === "small" ? "h-9.4" : "h-10.6"
              } [&>div]:flex [&>div]:justify-center [&>div]:items-center [&>div]:h-full [&>div]:w-full z-10 ${
                disabled ? "" : "[&>div]:cursor-pointer"
              }`}
            >
              {leftIcon}
            </span>
          )}
          <div>
            <div className="relative h-fit w-full">
              <input
                ref={ref}
                type={type}
                className={cn(
                  inputDefaultCVA({
                    className,
                    note: disabled ? "disabled" : note,
                    scale,
                    variant,
                    variantColor,
                  })
                )}
                id={id}
                disabled={disabled}
                {...restProps}
              />
            </div>
            <ChildAccordion active={!!message}>
              <NoteMessage variant={note}>{message}</NoteMessage>
            </ChildAccordion>
          </div>
        </div>
      </div>
    );
  }
);
InputDefault.displayName = "CommonInputDefault";
export { InputDefault };
