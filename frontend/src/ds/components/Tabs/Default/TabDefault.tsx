'use client';
import { type HTMLAttributes } from 'react';
import { VariantProps } from 'class-variance-authority';

import { cn } from '@/ds/utils/cnMerge';
import { Body } from '@/ds/typography/Body/Body';
import { tabDefaultCVA } from './tabDefaultCVA';

interface TabDefaultProps
  extends HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tabDefaultCVA> {
  children?: React.ReactNode;
  active?: boolean;
  icon?: React.ReactNode;
}

const TabDefault = ({
  children,
  variant,
  className,
  active,
  variantColor,
  icon,
  ...restProps
}: TabDefaultProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        tabDefaultCVA({
          className,
          variant,
          variantColor,
          state: active ? 'active' : 'none',
        }),
      )}
    >
      {icon && icon}
      <Body weight={'SemiBold'} className="truncate">
        {children}
      </Body>

    </div>
  );
};
export { TabDefault };
