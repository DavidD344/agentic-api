import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';

interface TableListUlProps extends HTMLAttributes<HTMLUListElement> {
  children?: React.ReactNode;
}
const TableListUl = ({
  children,
  className,
  ...restProps
}: TableListUlProps) => {
  return (
    <ul
      {...restProps}
      className={cn(
        'flex flex-col w-full border-b-2 border-GrayScale-Border-Default',
        className,
      )}
    >
      {children}
    </ul>
  );
};

export { TableListUl };
