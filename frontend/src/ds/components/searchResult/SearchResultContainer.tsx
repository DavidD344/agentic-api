import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';
interface SearchResultContainerProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
}

const SearchResultContainer = ({ children, className, ...restProps }: SearchResultContainerProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        'bg-DSGlobalBackgroundColor w-full border-DSGlobalText border-[0.1rem] rounded-[1rem] px-3 py-4',
        className,
      )}
    >
      {children}
    </div>
  );
};

export { SearchResultContainer };
