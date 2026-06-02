"use client";
import { Body } from '@/ds/typography/Body/Body';
import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';
interface PaginationRootProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  selectPage: () => void;
  active: boolean;
}
const PaginationElement = ({
  children,
  className,
  active,
  selectPage,
  ...restProps
}: PaginationRootProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        `inline-block justify-center items-center w-8 h-8 rounded-[0.3rem] cursor-pointer hover:bg-white transition-all duration-300  text-GrayScale-TextIcon-Body flex-shrink-0 ${
          active &&
          'bg-GrayScale-TextIcon-Body text-white hover:text-GrayScale-TextIcon-Body '
        }`,
        className,
      )}
      onClick={() => {
        selectPage();
      }}
    >
      <Body
        weight={'Regular'}
        className={`text-center flex justify-center items-center h-full w-full`}
      >
        {children}
      </Body>
    </div>
  );
};

export { PaginationElement };
