import { Body } from '@/ds/typography/Body/Body';
import { H2 } from '@/ds/typography/H2/H2';
import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';
interface EmptyStateProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  title: string;
  message: string;
  linkImg?: string;
}

const EmptyState = ({
  children,
  className,
  title,
  message,
  linkImg,
  ...restProps
}: EmptyStateProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        'sm:max-w-[58rem] w-full h-fit flex flex-col justify-center items-center gap-y-6 ',
        className,
      )}
    >
      <img src={linkImg || '/soonReadyBanner.png'} alt="" />
      <H2 weight={'SemiBold'} className="text-center text-[#231111]">
        {title}
      </H2>
      <Body
        weight={'Regular'}
        className="text-center text-[#231111]"
      >
        {message}
      </Body>
      {children}
    </div>
  );
};

export { EmptyState };
