import { HTMLAttributes } from "react";
import { cn } from "@/ds/utils/cnMerge";
import { VariantProps } from "class-variance-authority";
import { h1CVA } from "./h1CVA";
interface H1Props
  extends HTMLAttributes<HTMLHeadingElement>,
    VariantProps<typeof h1CVA> {
  children: React.ReactNode;
}

const H1 = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: H1Props) => {
  return (
    <h1
      className={cn(
        h1CVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </h1>
  );
};

export { H1 };
