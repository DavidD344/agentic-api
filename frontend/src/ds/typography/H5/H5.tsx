import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h5CVA } from "./h5CVA";
export interface H5Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h5CVA> {
  children: React.ReactNode;
}

const H5 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H5Props) => {
  return (
    <h5
      className={cn(
        h5CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h5>
  );
};

export { H5 };
