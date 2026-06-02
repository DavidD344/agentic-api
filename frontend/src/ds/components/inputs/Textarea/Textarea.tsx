"use client";
import { H6 } from "@/ds/typography/H6/H6";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { InputHTMLAttributes, forwardRef, isValidElement } from "react";
import { ChildAccordion } from "../../../animations/ChildAccordion/ChildAccordion";
import { NoteMessage } from "../../noteMessage/NoteMessage";
import { textareaCVA } from "./textareaCVA";

interface textareaProps
  extends InputHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof textareaCVA> {
  ref?: React.Ref<HTMLTextAreaElement>;
  disabled?: boolean;
  message?: string | undefined;
  label?: string | React.ReactNode;
}

const Textarea = forwardRef<HTMLTextAreaElement, textareaProps>(
  (
    {
      variant,
      label,
      note,
      message,
      disabled,
      className,
      variantColor,
      id,
      ...restProps
    },
    ref
  ) => {
    return (
      <div className="h-fit w-full">
        {label && (
          <label htmlFor={id}>
            {isValidElement(label) &&
            typeof (label as React.ReactElement).type === "string" ? (
              <div className="font-semibold text-[1.1rem] leading-[1.6rem] font-sfpro mb-1 text-GrayScale-TextIcon-Subtitle">
                {label}
              </div>
            ) : (
              <H6 weight={"Regular"} className={cn("mb-3",variantColor === "black"? 'text-[#F5F5F5]' : 'text-[#000]')}>
                {label}
              </H6>
            )}
          </label>
        )}
        <div className="h-fit w-full">
          <div className="relative h-fit w-full">
            <textarea
              ref={ref}
              className={cn(
                textareaCVA({
                  className,
                  variantColor,
                  note: disabled ? "disabled" : note,
                  variant,
                })
              )}
              {...restProps}
              id={id}
              disabled={disabled}
            />
          </div>
          <ChildAccordion active={!!message}>
            <NoteMessage variant={note}>{message}</NoteMessage>
          </ChildAccordion>
        </div>
      </div>
    );
  }
);
Textarea.displayName = "Commontextarea";
export { Textarea };
