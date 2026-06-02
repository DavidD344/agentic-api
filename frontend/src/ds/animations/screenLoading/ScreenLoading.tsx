import { cn } from '@/ds/utils/cnMerge';
import { HTMLAttributes } from 'react';

interface ScreenLoadingProps extends HTMLAttributes<HTMLDivElement> {
  active?: boolean;
}

const ScreenLoading = ({
  className,
  ...restProps
}: ScreenLoadingProps) => {
  return (
    <div
      {...restProps}
      className={cn('flex flex-col justify-center items-center py-11 bg-DSGlobalBackgroundColor', className)}
      role="status"
    >
      <div
        className="text-DSGlobalText inline-block h-11 w-11 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
        role="status"
      >
        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]" />
      </div>
    </div>
  );
};

export { ScreenLoading };
