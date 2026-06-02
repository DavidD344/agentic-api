import { HTMLAttributes } from 'react';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { liBodyCVA } from './liBodyCVA';
interface LiBodyProps
  extends HTMLAttributes<HTMLLIElement>,
    VariantProps<typeof liBodyCVA> {
  children: React.ReactNode;
}

const LiBody = ({
  className,
  weight,
  font,
  children,
  ...restProps
}: LiBodyProps) => {
  return (
    <li
      className={cn(
        liBodyCVA({
          className,
          weight,
          font,
        }),
      )}
      {...restProps}
    >
      {children}
    </li>
  );
};

export { LiBody };
