import { cva } from 'class-variance-authority';

export const sectionMessageCVA = cva(
  `flex flex-row gap-x-4 p-4 rounded-[3px] text-GrayScale-TextIcon-Title `,
  {
    variants: {
      variant: {
        none: 'opacity-0',
        default: 'bg-[#DEEBFF]',
        confirmation: 'bg-[#E3FCEF]',
        warning: 'bg-[#FFFAE6]',
        error: 'bg-[#FFEBE6]',
        change: 'bg-[#EAE6FF]',
      },
    },
    defaultVariants: {
      variant: 'none',
    },
  },
);
