import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { ButtonHTMLAttributes, forwardRef } from "react";
import { Spin } from "../../../animations/spin/Spin";
import { buttonDefaultCVA } from "./buttonDefaultCVA";

interface ButtonDefaultProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonDefaultCVA> {
  children?: React.ReactNode;
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  ref?: React.Ref<HTMLButtonElement>;
}

const ButtonDefault = forwardRef<HTMLButtonElement, ButtonDefaultProps>(
  (
    {
      variant,
      variantColor,
      isLoading,
      disabled,
      className,
      children,
      variantSize,
      icon,
      ...restProps
    },
    ref
  ) => {
    return (
      <button
        disabled={disabled || isLoading}
        ref={ref}
        type="button"
        className={cn(
          buttonDefaultCVA({
            className,
            variant,
            variantSize,
            variantColor,
            state: isLoading ? "loading" : disabled ? "disabled" : "active",
          })
        )}
        {...restProps}
      >
        {isLoading ? (
          <Spin />
        ) : (
          <>
            <p>
              {children}
            </p>
            {icon && icon}
          </>
        )}
      </button>
    );
  }
);
ButtonDefault.displayName = "CommonButtonDefault";
export { ButtonDefault };
