import { cn } from "@/ds/utils/cnMerge";
import { LabelHTMLAttributes } from "react";

interface InputCheckBoxLabelProps
  extends LabelHTMLAttributes<HTMLLabelElement> {
  children: React.ReactNode;
}

const InputCheckBoxLabel = ({
  children,
  className,
  ...restProps
}: InputCheckBoxLabelProps) => {
  return (
    <label
      {...restProps}
      className={cn(
        "flex flex-row justify-start items-center gap-2 py-3 px-6 cursor-pointer transition-all hover:bg-DFDSTabTransparent rounded-[1.0rem]",
        className
      )}
    >
      {children}
    </label>
  );
};
export { InputCheckBoxLabel };
