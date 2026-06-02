import { HTMLAttributes } from "react";
import { VariantProps } from "class-variance-authority";
import { bodyCVA } from "./bodyCVA";
import { cn } from "@/ds/utils/cnMerge";
interface BodyProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof bodyCVA> {
  children: React.ReactNode;
}

const Body = ({
  className,
  weight,
  size,
  font,
  children,
  ...restProps
}: BodyProps) => {
  return (
    <p
      className={cn(
        bodyCVA({
          className,
          weight,
          size,
          font,
        })
      )}
      {...restProps}
    >
      {children}
    </p>
  );
};

export { Body };
