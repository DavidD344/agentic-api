'use client';
import { InputHTMLAttributes, forwardRef, isValidElement } from 'react';
import { VariantProps } from 'class-variance-authority';
import { ChildAccordion } from '../../../animations/ChildAccordion/ChildAccordion';
import { selectCVA } from './selectCVA';
import { NoteMessage } from '../../noteMessage/NoteMessage';
import { cn } from '@/ds/utils/cnMerge';
import { H6 } from '@/ds/typography/H6/H6';

export interface SelectProps
  extends InputHTMLAttributes<HTMLSelectElement>,
    VariantProps<typeof selectCVA> {
  ref?: React.Ref<HTMLSelectElement>;
  disabled?: boolean;
  message?: string | undefined;
  label?: string | React.ReactNode;
  labelRequired?: boolean;
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      variant,
      variantColor,
      label,
      labelRequired,
      note,
      scale,
      message,
      disabled,
      children,
      className,
      id,
      ...restProps
    },
    ref,
  ) => {
    return (
    
      <div className="h-fit w-full">
        {label && (
          <label htmlFor={id}>
            {isValidElement(label) &&
            typeof (label as React.ReactElement).type === 'string' ? (
              <div className="font-semibold text-[1.1rem] leading-[1.6rem] font-sfpro mb-1 text-GrayScale-TextIcon-Subtitle">
                {label}
              </div>
            ) : (
              <H6 weight={"Regular"} className={cn("mb-3",variantColor === "black"? 'text-[#F5F5F5]' : 'text-[#000]')}>
              {label} {labelRequired && <span className="text-R800">*</span>}
            </H6>
            )}
          </label>
        )}
        <div className="h-fit w-full">
          <div className="relative h-fit w-full">
            <select
              ref={ref}
              className={cn(
                selectCVA({
                  className,
                  note: disabled ? 'disabled' : note,
                  variant,
                  variantColor,
                  scale,
                }),
              )}
              {...restProps}
              id={id}
              disabled={disabled}
            >
              {children}
            </select>
          </div>
          <ChildAccordion active={!!message}>
            <NoteMessage variant={note}>{message}</NoteMessage>
          </ChildAccordion>
        </div>
      </div>
    );
  },
);
Select.displayName = 'CommonSelect';
export { Select };
