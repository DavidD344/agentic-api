import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h2CVA } from "./h2CVA";
interface H2Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h2CVA> {
  children: React.ReactNode;
}

const H2 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H2Props) => {
  return (
    <h2
      className={cn(
        h2CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h2>
  );
};

export { H2 };
