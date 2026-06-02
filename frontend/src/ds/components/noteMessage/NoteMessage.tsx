"use client";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { noteMessageCVA } from "./noteMessageCVA";

interface NoteMessageProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof noteMessageCVA> {
  children?: React.ReactNode;
}

const NoteMessage = ({
  children,
  variant,
  className,
  ...restProps
}: NoteMessageProps) => {
  return (
    <p
      {...restProps}
      className={cn(
        noteMessageCVA({
          className,
          variant,
        })
      )}
    >
      {/* {variant === "dangerous" && (
        <ErrorIcon label="" primaryColor="#DE350B" size="small" />
      )}
      {variant === "success" && (
        <EditorSuccessIcon label="" primaryColor="#00875A" size="small" />
      )} */}
      {variant === "none" ? <br /> : children}
    </p>
  );
};

export { NoteMessage };
