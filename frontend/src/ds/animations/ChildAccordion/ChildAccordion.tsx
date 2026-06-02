import { cn } from '@/ds/utils/cnMerge';
import { type HTMLAttributes } from 'react';
interface ChildAccordionProps extends HTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  active?: boolean;
}

const ChildAccordion = ({
  children,
  active,
  className,
  ...restProps
}: ChildAccordionProps) => {
  return (
    <div
      {...restProps}
      className={cn(
        `transition-height-father ${
          active ? 'transition-height-father-active' : 'opacity-0'
        }`,
        className,
      )}
    >
      <div className="transition-height-child">{children}</div>
    </div>
  );
};

export { ChildAccordion };
