import { cva } from 'class-variance-authority';

export const noteMessageCVA = cva(
  `flex flex-row justify-start items-center font-normal mt-1 text-[1.4rem]`,
  {
    variants: {
      variant: {
        none: 'opacity-0',
        dangerous: 'text-[#DB3444]',
        success: 'text-[#00875A]',
        disabled: 'opacity-0',
      },
    },
    defaultVariants: {
      variant: 'none',
    },
  },
);
