import { HTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';
import { strongPasswordCVA } from './strongPasswordCVA';
import { cn } from '@/ds/utils/cnMerge';
import { Body } from '@/ds/typography/Body/Body';

interface StrongPasswordProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof strongPasswordCVA> {
  bars: { num: number; message: string }[];
  messageMinimalLength: string;
}

const StrongPassword = ({
  step,
  className,
  bars,
  messageMinimalLength,
  ...restProps
}: StrongPasswordProps) => {
  return (
    <div
      className={cn(
        className,
        ' w-full h-fit gap-y-2 flex flex-col justify-start items-center',
      )}
      {...restProps}
    >
      <div className="duration-500 w-full h-fit gap-x-1 flex flex-row justify-between items-center">
        {bars.map(({ num }, index) => {
          return (
            <div
              key={index}
              className={strongPasswordCVA({
                step:
                  step !== null && step !== undefined
                    ? step >= num
                      ? num as 0 | 1 | 2 | 3 | 4 
                      : 0
                    : 0,
              })}
            />
          );
        })}
      </div>
      <Body weight={'Regular'} className="text-DSGlobalText w-full ">
        {step !== null && step !== undefined ? (
          step !== 0 ? (
            bars[step - 1].message
          ) : (
            messageMinimalLength
          )
        ) : (
          <br />
        )}
      </Body>
    </div>
  );
};
export { StrongPassword };
