import { HTMLAttributes } from 'react';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { linkDefaultCVA } from './linkDefaultCVA';
interface BodyProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof linkDefaultCVA> {
  children: React.ReactNode;
}

const LinkDefault = ({
  className,
  weight,
  font,
  children,
  ...restProps
}: BodyProps) => {
  return (
    <span
      className={cn(
        linkDefaultCVA({
          className,
          weight,
          font,
        }),
      )}
      {...restProps}
    >
      {children}
    </span>
  );
};

export { LinkDefault };
