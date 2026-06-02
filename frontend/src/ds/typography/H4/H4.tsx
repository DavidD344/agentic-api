import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h4CVA } from "./h4CVA";
interface H4Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h4CVA> {
  children: React.ReactNode;
}

const H4 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H4Props) => {
  return (
    <h4
      className={cn(
        h4CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h4>
  );
};

export { H4 };
