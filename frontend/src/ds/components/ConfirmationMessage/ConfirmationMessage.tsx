'use client';
import { Body } from '@/ds/typography/Body/Body';
import { H5 } from '@/ds/typography/H5/H5';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { type HTMLAttributes } from 'react';
import { confirmationMessageCVA } from './confirmationMessageCVA';

interface ConfirmationMessageProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof confirmationMessageCVA> {
  children?: React.ReactNode;
  title?: string;
  message?: string;
}

const ConfirmationMessage = ({
  children,
  variant,
  className,
  title,
  message,
  ...restProps
}: ConfirmationMessageProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        confirmationMessageCVA({
          className,
          variant,
        }),
      )}
    >

      <div className="flex flex-col justify-start items-start gap-y-2 ">
        {title && (
          <H5 weight={'SemiBold'} className="">
            {title}
          </H5>
        )}
        {variant === 'none' ? (
          <br />
        ) : (
          <Body weight={'Regular'}>{message}</Body>
        )}
        <div className="w-full flex flex-row gap-3 pt-3">{children}</div>
      </div>
    </div>
  );
};
export { ConfirmationMessage };
