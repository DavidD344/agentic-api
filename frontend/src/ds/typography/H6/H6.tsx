import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h6CVA } from "./h6CVA";
interface H6Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h6CVA> {
  children: React.ReactNode;
}

const H6 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H6Props) => {
  return (
    <h6
      className={cn(
        h6CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h6>
  );
};

export { H6 };
