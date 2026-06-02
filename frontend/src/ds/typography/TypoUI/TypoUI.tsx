import { HTMLAttributes } from 'react';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { typoUICVA } from './typoUICVA';
interface BodyProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof typoUICVA> {
  children: React.ReactNode;
}

const TypoUI = ({
  className,
  weight,
  font,
  children,
  ...restProps
}: BodyProps) => {
  return (
    <p
      className={cn(
        typoUICVA({
          className,
          weight,
          font,
        }),
      )}
      {...restProps}
    >
      {children}
    </p>
  );
};

export { TypoUI };
