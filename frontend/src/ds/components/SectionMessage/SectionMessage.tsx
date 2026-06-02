'use client';
import { Body } from '@/ds/typography/Body/Body';
import { H5 } from '@/ds/typography/H5/H5';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';
import { sectionMessageCVA } from './sectionMessageCVA';

interface SectionMessageProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof sectionMessageCVA> {
  children?: React.ReactNode;
  title?: string;
}

const SectionMessage = ({
  children,
  variant,
  className,
  title,

  ...restProps
}: SectionMessageProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        sectionMessageCVA({
          className,
          variant,
        }),
      )}
    >

      <div className="flex flex-col justify-start items-start gap-y-3 ">
        {title && (
          <H5 weight={'SemiBold'} className="">
            {title}
          </H5>
        )}
        {variant === 'none' ? (
          <br />
        ) : (
          <Body weight={'Regular'}>{children}</Body>
        )}
      </div>
    </div>
  );
};
export { SectionMessage };
