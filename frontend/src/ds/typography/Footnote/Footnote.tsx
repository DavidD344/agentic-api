import { HTMLAttributes } from 'react';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { footnoteCVA } from './footnoteCVA';
export interface FootnoteProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof footnoteCVA> {
  children: React.ReactNode;
}

const Footnote = ({
  className,
  weight,
  font,
  children,
  ...restProps
}: FootnoteProps) => {
  return (
    <p
      className={cn(
        footnoteCVA({
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

export { Footnote };
