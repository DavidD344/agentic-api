'use client';
import { Footnote } from '@/ds/typography/Footnote/Footnote';
import { cn } from '@/ds/utils/cnMerge';
import { VariantProps } from 'class-variance-authority';
import { InputHTMLAttributes, forwardRef } from 'react';
import { ChildAccordion } from '../../../animations/ChildAccordion/ChildAccordion';
import { NoteMessage } from '../../noteMessage/NoteMessage';
import { inputCheckBoxCVA } from './inputCheckBoxCVA';

interface inputCheckBoxProps
  extends InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputCheckBoxCVA> {
  ref?: React.Ref<HTMLInputElement>;
  disabled?: boolean;
  message?: string | undefined;
  label?: string;
}

const InputCheckBox = forwardRef<HTMLInputElement, inputCheckBoxProps>(
  (
    {
      variant,
      label,
      note,
      message,
      disabled,
      className,
      id,
      ...restProps
    },
    ref,
  ) => {
    return (
      <div className="h-fit w-fit">
        {label && (
          <label htmlFor={id}>
            <Footnote weight={'Bold'} className="mb-1 text-DSGlobalText">
              {label}
            </Footnote>
          </label>
        )}
        <div className="h-fit w-full">
          <div className="relative h-fit w-full">
            <input
              type="checkbox"
              ref={ref}
              className={cn(
                inputCheckBoxCVA({
                  className,
                  note: disabled ? 'disabled' : note,
                  variant,
                }),
              )}
              {...restProps}
              id={id}
              disabled={disabled}
            />
          </div>
          <ChildAccordion active={!!message}>
            <NoteMessage variant={note}>{message}</NoteMessage>
          </ChildAccordion>
        </div>
      </div>
    );
  },
);
InputCheckBox.displayName = 'CommonInputCheckBox';
export { InputCheckBox };
