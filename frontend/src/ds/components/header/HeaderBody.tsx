import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';
interface HeaderBodyProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const HeaderBody = ({ children, className, ...restProps }: HeaderBodyProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        'h-full flex flex-row justify-center items-center gap-4',
        className,
      )}
    >
      {children}
    </div>
  );
};

export { HeaderBody };
