import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h3CVA } from "./h3CVA";
interface H3Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h3CVA> {
  children: React.ReactNode;
}

const H3 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H3Props) => {
  return (
    <h3
      className={cn(
        h3CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h3>
  );
};

export { H3 };
