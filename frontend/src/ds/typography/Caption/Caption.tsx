import { HTMLAttributes } from 'react';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { captionCVA } from './captionCVA';
interface CaptionProps
  extends HTMLAttributes<HTMLParagraphElement>,
    VariantProps<typeof captionCVA> {
  children: React.ReactNode;
}

const Caption = ({
  className,
  weight,
  font,
  children,
  ...restProps
}: CaptionProps) => {
  return (
    <p
      className={cn(
        captionCVA({
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

export { Caption };
