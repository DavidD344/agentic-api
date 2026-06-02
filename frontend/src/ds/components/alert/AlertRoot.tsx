"use client";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { type HTMLAttributes } from "react";
import { alertRootCVA } from "./alertRootCVA";
import SvgCloseWindow from "@/ds/icons/svgReact/CloseWindow";

interface AlertRootProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertRootCVA> {
  children?: React.ReactNode;
  headerContent?: React.ReactNode;
  clearConfirmationMessage?: () => void;
  hiddenHeader?: boolean;
  closeIconBlack?: boolean;
}

const AlertRoot = ({
  children,
  variant,
  className,
  borderContainer,
  borderRounded,
  paddingDefault,
  header,
  headerContent,
  clearConfirmationMessage,
  hiddenHeader,
  closeIconBlack,
  ...restProps
}: AlertRootProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        alertRootCVA({
          borderContainer,
          borderRounded,
          paddingDefault,
          className,
          variant,
        })
      )}
    >
      {header && headerContent && (
        <div
          className={cn(
            "w-full flex flex-row justify-between items-center",
            hiddenHeader ? "hidden" : ""
          )}
        >
          {headerContent}
          <div className={clearConfirmationMessage ? "" : "hidden"}>
            <div
              onClick={clearConfirmationMessage}
              className="w-fit h-fit cursor-pointer hover:scale-[1.1] transition-all duration-300 rounded-full "
            >
              <SvgCloseWindow
                className=""
                style={{ fill: closeIconBlack ? "#0B090D" : "var(--ds-global-text)" }}
                width={40}
                height={40}
              />
            </div>
          </div>
        </div>
      )}
      {children}
    </div>
  );
};

export { AlertRoot };
